import { Argv, Arguments } from 'yargs'
import config from '../../config'
import { onCancel, ParamsError } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import Contract, { getFileChoices, fetchSolcVersions, loadRemoteVersion } from '../../service/contract'

import { FileFormat } from '../../model/type/file.type'
import { CompileType, MinimalSolcInstance } from '../../model/type/compile.type'

export const command = 'compile'
export const desc = '編譯 Solidity 合約'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk eth contract compile --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  if (!argv.interactive) throw new ParamsError('Invalid params: Required parameter missing')

  const { contractFolderPath } = await prompts({
    type: 'text',
    name: 'contractFolderPath',
    message: 'What is the folder path of compile contract?',
  }, { onCancel })

  // select compile contract
  const { contractFilePath } = await prompts({
    type: 'select',
    name: 'contractFilePath',
    message: 'What is the name of deploy contract?',
    choices: getFileChoices(contractFolderPath, FileFormat.SOL),
  }, { onCancel })

  const { compileFunction } = await prompts({
    type: 'select',
    name: 'compileFunction',
    message: 'What is the compile function?',
    choices: [
      {
        title: 'bdk solc (version 0.8.17)',
        value: CompileType.BDK_SOLC,
        description: 'Uses bdk\'s remote solc version 0.8.17',
      },
      {
        title: 'Local solc',
        value: CompileType.LOCAL_SOLC,
        description: 'Uses the solc version installed on your machine',
      },
      {
        title: 'Load remote solc',
        value: CompileType.REMOTE_SOLC,
        description: 'Load a specific version of solc from the internet',
      },
    ],
  })

  let solcInstance: MinimalSolcInstance | null = null
  if (compileFunction === CompileType.REMOTE_SOLC) {
    const choices = await fetchSolcVersions()
    const response = await prompts({
      type: 'select',
      name: 'version',
      message: 'Please select the Solidity version to use:',
      choices,
    })

    const fullFilename = response.version
    if (!fullFilename) {
      throw new ParamsError('Invalid params: Required parameter missing')
    }

    const selectedVersion = fullFilename.replace('soljson-', '').replace('.js', '')

    const loadSpinner = ora(`🔄 Loading Solidity ${selectedVersion}...`).start()
    solcInstance = await loadRemoteVersion(selectedVersion)
    loadSpinner.succeed(`Solc version ${selectedVersion} loaded successfully`)
  }

  const spinner = ora('Contract comlile ...').start()

  const contract = new Contract(config, 'quorum')
  contract.compile(contractFolderPath, contractFilePath, compileFunction, solcInstance)

  spinner.succeed(`Contract compile Successfully! file at:${contractFolderPath}/build`)
}
