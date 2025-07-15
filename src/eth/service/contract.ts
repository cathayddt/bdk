import fs from 'fs'
import path from 'path'
import { ethers, isAddress } from 'ethers'
import { AbstractService } from './Service.abstract'
import { FileFormat } from '../model/type/file.type'
import { NotFoundWarn, PathError, SolcError, FileWriteError, DeployError } from '../../util/error'
import { PromptObject } from 'prompts'
import { logger } from '../../util'
import { ContractABI, ABIComponent, ABIPrimitiveType, ABIArrayType, ABIResult } from '../model/type/abi.type'
import { MinimalSolcInstance } from '../model/type/compile.type'
import solc from 'solc'
import * as childProcess from 'child_process'
import { tarDateFormat } from '../../util/utils'
import axios from 'axios'
import semver from 'semver'

export function getFileChoices (contractFolderPath: string, fileFormat: FileFormat) {
  try {
    if (!fs.existsSync(contractFolderPath)) {
      throw new PathError(`❌ Folder not found: ${contractFolderPath}`)
    }

    const files = fs.readdirSync(contractFolderPath)

    // Filter out files in the corresponding format
    let filterFiles: string[] = []
    switch (fileFormat) {
      case FileFormat.JSON:
        filterFiles = files.filter(file => file.endsWith('.json'))
        break
      case FileFormat.SOL:
        filterFiles = files.filter(file => file.endsWith('.sol'))
        break
      case FileFormat.BIN:
        filterFiles = files.filter(file => file.endsWith('.bin'))
        break
      default:
        throw new NotFoundWarn(`⚠️ Not find file format: ${fileFormat}`)
    }

    if (filterFiles.length === 0) {
      throw new NotFoundWarn('⚠️ No matching contract files found!')
    }

    // Convert to the format required by prompts
    return filterFiles.map(file => ({
      title: file,
      value: path.join(contractFolderPath, file),
    }))
  } catch (error) {
    if (error instanceof PathError || error instanceof NotFoundWarn) {
      logger.warn(error.message)
    }
    return []
  }
}

export async function getPragmaVersion (contractPath: string): Promise<string> {
  const sourceCode = await fs.promises.readFile(contractPath, 'utf-8')

  const match = sourceCode.match(/pragma\s+solidity\s+([^;]+);/)
  if (!match || !match[1]) {
    throw new SolcError('No pragma version found in contract source code')
  }

  return match[1].trim()
}

export function findVersionAndEvm (
  pragmaRange: string,
  choices: { title: string; value: string }[],
) {
  const versions = choices.map(c => c.title)
  const matched = semver.maxSatisfying(versions, pragmaRange)

  if (!matched) {
    throw new SolcError(`No matching solc version for pragma: ${pragmaRange}`)
  }

  const selectedChoice = choices.find(c => c.title === matched)
  if (!selectedChoice) {
    throw new SolcError(`No matching solc version for title: ${matched}`)
  }
  const version = selectedChoice.value
    .replace('soljson-', '')
    .replace('.js', '')

  return version
}

// get solc all versions
export async function fetchSolcVersions (): Promise<{ title: string; value: string }[]> {
  const res = await axios.get('https://binaries.soliditylang.org/bin/list.json')

  const choices = Object.entries(res.data.releases as Record<string, string>)
    .sort((a, b) => b[0].localeCompare(a[0], undefined, { numeric: true }))
    .map(([displayVer, fullVer]) => ({
      title: displayVer,
      value: fullVer,
    }))

  return choices
}

// load solc remote version use version number
export async function loadRemoteVersion (selectedVersion: string): Promise<MinimalSolcInstance> {
  return await new Promise((resolve, reject) => {
    solc.loadRemoteVersion(
      selectedVersion,
      (err: Error | null, solcInstance: any) => {
        if (err) {
          return reject(new SolcError(`${err}`))
        }
        resolve(solcInstance)
      },
    )
  })
}

export function checkSolcAvailability (): void {
  try {
    childProcess.execSync('solc --version', { encoding: 'utf-8' })
  } catch (error: unknown) {
    throw new SolcError('❌ solc is not available or version parsing failed')
  }
}

export default class Contract extends AbstractService {
  /**
   * @description compile contract
   * @param contractFolderPath
   * @param contractFilePath
   * @param compileFunction
   */
  public compile (contractFolderPath: string, contractFilePath: string, compileFunction: string, solcInstance: MinimalSolcInstance | null = null) {
    switch (compileFunction) {
      case 'bdkSolc':
        this.bdkSolcCompile(contractFolderPath, contractFilePath)
        break
      case 'localSolc':
        checkSolcAvailability()
        this.localSolcCompile(contractFolderPath, contractFilePath)
        break
      case 'remoteSolc':
        this.bdkSolcCompile(contractFolderPath, contractFilePath, solcInstance)
        break
      default:
        logger.debug('Invalid selection')
        break
    }
  }

  public createWallet = (privateKey: string, provider: any) => new ethers.Wallet(privateKey, provider)

  /**
   *
   * @description deploy contract
   * @param contractFilePath
   * @param privateKey
   * @param params
   * @returns
   */
  public async deploy (contractFilePath: string, privateKey: string, port: string, params: any, value: string) {
    try {
      let contractJson
      try {
        contractJson = JSON.parse(fs.readFileSync(contractFilePath, 'utf8'))
      } catch (error) {
        throw new DeployError(`Invalid JSON format in contract file: ${contractFilePath}`)
      }
      if (!contractJson || typeof contractJson !== 'object' || !contractJson.abi || !contractJson.bytecode) {
        throw new DeployError(`Invalid contract JSON structure: ${contractFilePath}`)
      }
      const provider = new ethers.JsonRpcProvider(port)
      const wallet = this.createWallet(privateKey, provider)
      const abi = contractJson.abi
      const bytecode = contractJson.bytecode

      const factory = new ethers.ContractFactory(
        abi,
        bytecode,
        wallet,
      )

      // build deploy options
      const deployOptions = value !== '0' ? { value: ethers.parseEther(value) } : {}

      // deploy contract with params and value
      const contract = params
        ? await factory.deploy(...Object.values(params), deployOptions)
        : await factory.deploy(deployOptions)

      await contract.waitForDeployment()
      this.bdkFile.createContractAddress(`${contractFilePath.split('/').pop()?.split('.')[0]}_${tarDateFormat(new Date())}`, contract.target.toString())
      return contract.target
    } catch (error) {
      throw new DeployError(`❌ An error occurred during deployment: ${error}`)
    }
  }

  public getContractAddress () {
    return this.bdkFile.getContractAddress()
  }

  private bdkSolcCompile (contractFolderPath: string, filename: string, solcInstance: MinimalSolcInstance | null = null): void {
    function getSources (contractFolderPath: string, filename: string) {
      const processedFiles = new Set()
      const sources: Record<string, { content: string }> = {}

      function readFile (filePath: string) {
        if (processedFiles.has(filePath)) return
        processedFiles.add(filePath)

        const content = fs.readFileSync(filePath, 'utf8')
        sources[path.relative(contractFolderPath, filePath)] = { content }

        const importRegex = /import\s+["']([^"']+)["'];/g
        let match
        while ((match = importRegex.exec(content)) !== null) {
          const importedFile = match[1]
          let importPath: string
          if (importedFile.startsWith('.')) {
            importPath = path.resolve(path.dirname(filePath), importedFile)
            readFile(importPath)
          } else {
            // node_modules module
            importPath = require.resolve(importedFile, {
              paths: [contractFolderPath],
            })
          }
        }
      }

      readFile(path.resolve(contractFolderPath, filename))
      return sources
    }

    try {
      const sources = getSources(contractFolderPath, filename)
      // build Solc Compile input
      const input = {
        language: 'Solidity',
        sources: sources,
        settings: {
          evmVersion: 'istanbul',
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode.object'],
            },
          },
        },
      }

      const importCallback = function (importPath: string) {
        try {
          const resolvedPath = require.resolve(importPath, { paths: [contractFolderPath] })
          const content = fs.readFileSync(resolvedPath, 'utf8')
          return { contents: content }
        } catch (err) {
          return { error: `File not found: ${importPath}` }
        }
      }

      // Compile the contract
      const output = solcInstance ? JSON.parse(solcInstance.compile(JSON.stringify(input), {
        import: importCallback,
      }))
        : JSON.parse(solc.compile(JSON.stringify(input), {
          import: importCallback,
        }))

      if (output.errors) {
        throw new SolcError(`❌ Solidity Compile Error: ${output.errors}`)
      }

      const buildDir = path.resolve(contractFolderPath, 'build')
      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true })
      }
      Object.keys(output.contracts).forEach((sourceFile) => {
        Object.keys(output.contracts[sourceFile]).forEach((contractName) => {
          const contractData = output.contracts[sourceFile][contractName]
          if (!contractData?.abi || !contractData?.evm?.bytecode?.object) {
            logger.warn(`⚠️ Contract ${contractName} has no ABI or bytecode.`)
            return
          }
          const contractPath = path.join(buildDir, `${contractName}.json`)
          try {
            fs.writeFileSync(contractPath, JSON.stringify({
              abi: contractData.abi,
              bytecode: contractData.evm.bytecode.object,
            }, null, 2))
            logger.debug(`✅ Contract ${contractName} compiled and saved to ${contractPath}`)
          } catch (error) {
            throw new FileWriteError(`❌ Error writing contract data: ${error}`)
          }
        })
      })
    } catch (error) {
      throw new SolcError(`❌ An error occurred during compilation: ${error}`)
    }
  }

  private localSolcCompile (contractFolderPath: string, filename: string): void {
    const contractPath = path.resolve(contractFolderPath, filename)
    let output: string
    const cliCmd = [
      'solc --base-path . --include-path node_modules/ --optimize',
      '--evm-version istanbul',
      `--combined-json abi,bin ${contractPath}`,
    ].join(' ')
    try {
      output = childProcess.execSync(cliCmd, { encoding: 'utf-8' })
    } catch (error: any) {
      throw new SolcError(`SolcError❌ An error occurred during compilation: ${error.message}`)
    }

    const buildDir = path.resolve(contractFolderPath, 'build')
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true })
    }

    let parsedOutput: any
    try {
      parsedOutput = JSON.parse(output)

      if (!parsedOutput.contracts || Object.keys(parsedOutput.contracts).length === 0) {
        throw new SolcError('SolcError❌ Compilation failed: No contracts found in output.')
      }
    } catch (parseError) {
      throw new SolcError(`SolcError❌ Failed to parse the solc output ${parseError}`)
    }

    // get contracts
    const contracts = parsedOutput.contracts
    for (const contractKey in contracts) {
      const contractData = contracts[contractKey]
      const contractName = contractKey.split(':').pop() // 取得合約名稱

      if (!contractName) continue

      const abi = contractData.abi
      const bytecode = contractData.bin

      const outputFile = path.join(buildDir, `${contractName}.json`)
      fs.writeFileSync(outputFile, JSON.stringify({ abi, bytecode }, null, 2))

      logger.debug(`✅ Contract ${contractName} has been compiled and the result has been saved in ${outputFile}`)
    }
  }

  public isConstructorPayable (contractFilePath: string): boolean {
    const contractJson = JSON.parse(fs.readFileSync(contractFilePath, 'utf8'))
    const abi: ContractABI = contractJson.abi
    const constructorAbi = abi.find(item => item.type === 'constructor')
    return constructorAbi?.stateMutability === 'payable'
  }

  public getParametersFromABI (contractFilePath: string): PromptObject[] {
    const contractJson = JSON.parse(fs.readFileSync(contractFilePath, 'utf8'))
    const abi: ContractABI = contractJson.abi
    const constructorAbi = abi.find(item => item.type === 'constructor')
    if (!constructorAbi || !constructorAbi.inputs?.length) return []

    const inputs = constructorAbi.inputs

    function getPromptType (type: string): PromptObject['type'] {
      if (type.endsWith('[]')) return 'text'
      if (type.startsWith('uint') || type.startsWith('int')) return 'number'
      if (type === 'bool') return 'toggle'
      if (type === 'address' || type === 'string' || type.startsWith('bytes')) return 'text'
      return 'text'
    }

    function parseTuple (input: ABIComponent, parentName = ''): ABIResult {
      if (!input.components || !Array.isArray(input.components)) {
        return []
      }
      const fieldName = parentName ? `${parentName}.${input.name}`.replace(/\.+$/, '') : input.name

      return input.components.map((component) => {
        if (component.type === 'tuple') {
          return parseTuple(component, fieldName)
        }
        return component.type as ABIPrimitiveType | ABIArrayType
      })
    }

    const questions: PromptObject[] = inputs.flatMap(input => {
      if (input.type === 'tuple') {
        return [{
          type: getPromptType(input.type),
          name: input.name,
          message: `Please enter ${input.name} (${input.type}) ex:${JSON.stringify(parseTuple(input, input.name))}`,
          validate: (value: any) => {
            try {
              JSON.parse(value)
              return true
            } catch (e) {
              return 'Invalid input format. Please ensure you enter a valid JSON format.'
            }
          },
        }] as any
      } else {
        return [{
          type: getPromptType(input.type),
          name: input.name,
          message: `Please enter ${input.name} (${input.type})`,
          validate: (value: any) => {
            if (input.type === 'address' && !isAddress(value)) {
              return 'Please enter a valid Ethereum address.'
            }
            return true
          },
        }] as any
      }
    })

    return questions
  }
}
