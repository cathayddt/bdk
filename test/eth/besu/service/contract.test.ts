/* global describe, it, before, after */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../src/eth/model/type/solc.d.ts" />
import fs from 'fs'
import assert from 'assert'
import path from 'path'
import config from '../../../../src/eth/config'
import Contract, { getFileChoices, fetchSolcVersions, loadRemoteVersion, getPragmaVersion, findVersionAndEvm, checkSolcAvailability } from '../../../../src/eth/service/contract'
import { SolcError, DeployError } from '../../../../src/util'
import { FileFormat } from '../../../../src/eth/model/type/file.type'
import { CompileType } from '../../../../src/eth/model/type/compile.type'
import { ethers } from 'ethers'
import sinon from 'sinon'

const rpcUrl = 'http://localhost:8545'
const baseDir = '__tests__'
const testDir = `${baseDir}/contracts`
const testDeployDir = '__tests__/contracts/build'
const contract = new Contract(config, 'besu')
const contractContent0_8_17 = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.17;

        contract SimpleStorage {
            uint256 private storedData;
            function get() public view returns (uint256) {
                return storedData;
            }
        }
      `
const contractContent0_8_20 = `
      // SPDX-License-Identifier: UNLICENSED
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.20;

      contract SimpleStorage {
          uint256 private storedData;
          function get() public view returns (uint256) {
              return storedData;
          }
      }
    `
const contractContentNotExistBytecode = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.17;
    `
const contract0_11_20 = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.11.20;
    `
const ContractInvalidJson = 'Contract Json Format Error'
const ContractInvalidFormat = '{"bytecode": "6080604052602a600055348015601457600080fd5b5060788060226000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80632096525514602d575b600080fd5b60005460405190815260200160405180910390f3fea2646970667358221220cf41b1c90bb1735c875a4939160d7dfde75914396a42d88b235d0bbce2160a5b64736f6c63430008110033"}'
const ContractJson = `
{
  "abi": [
    {
      "inputs": [],
      "name": "getValue",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "bytecode": "6080604052602a600055348015601457600080fd5b5060788060226000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80632096525514602d575b600080fd5b60005460405190815260200160405180910390f3fea2646970667358221220cf41b1c90bb1735c875a4939160d7dfde75914396a42d88b235d0bbce2160a5b64736f6c63430008110033"
}
`

const constructor1 = `
{
  "abi": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_anotherContractAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "another",
      "outputs": [
        {
          "internalType": "contract AnotherContract",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getValueFromAnotherContract",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "bytecode": "608060405234801561001057600080fd5b506040516101e03803806101e083398101604081905261002f91610054565b600080546001600160a01b0319166001600160a01b0392909216919091179055610084565b60006020828403121561006657600080fd5b81516001600160a01b038116811461007d57600080fd5b9392505050565b61014d806100936000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063291ae4a01461003b5780637a3f119e14610056575b600080fd5b610043610081565b6040519081526020015b60405180910390f35b600054610069906001600160a01b031681565b6040516001600160a01b03909116815260200161004d565b60008060009054906101000a90046001600160a01b03166001600160a01b031663209652556040518163ffffffff1660e01b8152600401602060405180830381865afa1580156100d5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100f991906100fe565b905090565b60006020828403121561011057600080fd5b505191905056fea2646970667358221220730159aaf1d1dfc601d9efe3687467e88855219ce5f11b1fa1cfeb96b0e506dd64736f6c63430008110033"
}
`

const constructor2 = `{
  "abi": [
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "b",
              "type": "bool"
            },
            {
              "components": [
                {
                  "internalType": "string",
                  "name": "name",
                  "type": "string"
                },
                {
                  "internalType": "uint256",
                  "name": "age",
                  "type": "uint256"
                }
              ],
              "internalType": "struct C3.Person",
              "name": "person",
              "type": "tuple"
            }
          ],
          "internalType": "struct C3.Car",
          "name": "_car",
          "type": "tuple"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "car",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "b",
          "type": "bool"
        },
        {
          "components": [
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "age",
              "type": "uint256"
            }
          ],
          "internalType": "struct C3.Person",
          "name": "person",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
}`

const constructor3 = `{
  "abi": [
    {
      "inputs": [],
      "stateMutability": "payable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "getBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ],
  "bytecode": "6080604052600080546001600160a01b03191633179055610184806100256000396000f3fe6080604052600436106100385760003560e01c806312065fe0146100445780633ccfd60b146100645780638da5cb5b1461007b57600080fd5b3661003f57005b600080fd5b34801561005057600080fd5b506040514781526020015b60405180910390f35b34801561007057600080fd5b506100796100b3565b005b34801561008757600080fd5b5060005461009b906001600160a01b031681565b6040516001600160a01b03909116815260200161005b565b6000546001600160a01b031633146101115760405162461bcd60e51b815260206004820152601760248201527f4f6e6c79206f776e65722063616e207769746864726177000000000000000000604482015260640160405180910390fd5b600080546040516001600160a01b03909116914780156108fc02929091818181858888f1935050505015801561014b573d6000803e3d6000fd5b5056fea2646970667358221220dbc7a96d24bdc0f936e12d24fc1858c123527d3dd2e21927e4f23537f4e2707964736f6c63430008110033"
}`

const contractImport = `
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import "./AnotherContract.sol";

contract MyContract {
    AnotherContract public another;
    
    constructor(address _anotherContractAddress) {
        another = AnotherContract(_anotherContractAddress);
    }
    
    function getValueFromAnotherContract() public view returns (uint256) {
        return another.getValue();
    }
}
`

const contractImport2 = `
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract AnotherContract {
    uint256 private value = 42;

    function getValue() public view returns (uint256) {
        return value;
    }
}
`
const choices = [
  { title: '0.8.30', value: 'soljson-v0.8.30+commit.73712a01.js' },
  { title: '0.8.29', value: 'soljson-v0.8.29+commit.ab55807c.js' },
  { title: '0.8.28', value: 'soljson-v0.8.28+commit.7893614a.js' },
  { title: '0.8.27', value: 'soljson-v0.8.27+commit.40a35a09.js' },
  { title: '0.8.20', value: 'soljson-v0.8.20+commit.a1b79de6.js' },
]
const privateKey = '0x6f5a95897341cac724e68d0d269cca26854ce90a79c3e784e7792015e032ac1e'
const params: any = []

describe('Besu.Contract.Service', function () {
  this.timeout(5000)
  describe('Besu.Contract.Service.Tool', () => {
    before(() => {
      createFolder(testDir)
    })

    after(() => {
      deleteFolder(baseDir)
    })
    it('should have error when path is error', () => {
      const res = getFileChoices('__invalid_path__', FileFormat.SOL)
      assert.deepStrictEqual(res, [])
    })

    it('should have error when file format is error', () => {
      const res = getFileChoices(testDir, FileFormat.BYTECODE_BIN)
      assert.deepStrictEqual(res, [])
    })

    it('should have error when file is not found', () => {
      const res = getFileChoices(testDir, FileFormat.BYTECODE_BIN)
      assert.deepStrictEqual(res, [])
    })

    it('should have warn when files not found', () => {
      const res = getFileChoices(testDir, FileFormat.BIN)
      assert.deepStrictEqual(res, [])
    })

    it('should return file choices', () => {
      createFile(`${testDir}/test.sol`)
      const fileChoices = getFileChoices(testDir, FileFormat.SOL)
      assert.deepStrictEqual(fileChoices, [{ title: 'test.sol', value: `${testDir}/test.sol` }])
    })

    it('should return empty array when not found constructor', () => {
      createFile(`${testDir}/test.json`, ContractJson)
      const res = contract.getParametersFromABI(`${testDir}/test.json`)
      assert.deepStrictEqual(res, [])
    })

    it('should return parameters when found constructor', () => {
      createFile(`${testDir}/test.json`, constructor1)
      contract.getParametersFromABI(`${testDir}/test.json`)
    })

    it('should return parameters when found constructor', () => {
      createFile(`${testDir}/test.json`, constructor2)
      contract.getParametersFromABI(`${testDir}/test.json`)
    })

    it('should return parameters when found constructor', () => {
      createFile(`${testDir}/test.json`, constructor3)
      contract.getParametersFromABI(`${testDir}/test.json`)
    })

    it('should return true when constructor is payable', () => {
      createFile(`${testDir}/test.json`, constructor3)
      const res = contract.isConstructorPayable(`${testDir}/test.json`)
      assert.strictEqual(res, true)
    })

    it('should return false when constructor is not payable', () => {
      createFile(`${testDir}/test.json`, constructor1)
      const res = contract.isConstructorPayable(`${testDir}/test.json`)
      assert.strictEqual(res, false)
    })

    it('should return choices when fetch solc versions', async () => {
      await fetchSolcVersions()
    })

    it('should return solcInstance when loadRemoteVersion successfully', async function () {
      this.timeout(30000)
      await loadRemoteVersion('v0.1.1+commit.6ff4cd6')
    })

    it('should return error when loadRemoteVersion successfully', async function () {
      this.timeout(10000)
      await assert.rejects(async () => {
        await loadRemoteVersion('v0.1.1')
      }, SolcError)
    })

    it('should return solc version when getPragmaVersion successfully', async () => {
      createFile(`${testDir}/test.json`, contractContent0_8_17)
      await getPragmaVersion(`${testDir}/test.json`)
    })

    it('should return error when getPragmaVersion failed', async () => {
      createFile(`${testDir}/test.json`, ContractInvalidJson)
      await assert.rejects(
        async () => {
          await getPragmaVersion(`${testDir}/test.json`)
        },
        SolcError,
      )
    })

    it('should return solc version when findVersion successfully', () => {
      createFile(`${testDir}/test.json`, contractContent0_8_20)
      const version = findVersionAndEvm('0.8.20', choices)
      assert.strictEqual(version, 'v0.8.20+commit.a1b79de6')
    })

    it('should return solc error when findVersion not found match version', () => {
      createFile(`${testDir}/test.json`, contract0_11_20)
      assert.throws(() => {
        findVersionAndEvm('0.11.20', choices)
      }, SolcError)
    })

    it('should return true when checkSolcAvailability', () => {
      checkSolcAvailability()
    })
  })

  describe('Besu.Contract.CompileBDKSolc', () => {
    before(() => {
      createFolder(testDir)
    })

    after(() => {
      deleteFolder(baseDir)
    })

    it('should not error when compile param error', () => {
      contract.compile(testDir, 'test.sol', 'error')
    })

    it('should have error when solc compile error', () => {
      createFolder(testDir)
      createFile(`${testDir}/test.sol`)
      assert.throws(() => {
        contract.compile(testDir, 'test.sol', CompileType.BDK_SOLC)
      }, SolcError)
    })

    it('should return bdkSolc compile successfully', () => {
      createFile(`${testDir}/test.sol`, contractContent0_8_17)
      contract.compile(testDir, 'test.sol', CompileType.BDK_SOLC)
    })

    it('should not error', () => {
      createFile(`${testDir}/test.sol`, contractContent0_8_17)
      contract.compile(testDir, 'test.sol', CompileType.BDK_SOLC)
    })

    it('should return solc error when compile with not exist bytecode', () => {
      createFile(`${testDir}/test.sol`, contractContentNotExistBytecode)
      assert.throws(() => {
        contract.compile(testDir, 'test.sol', CompileType.BDK_SOLC)
      }, SolcError, 'Solidity Compile Error')
    })

    it('should return bdkSolc compile successfully', () => {
      createFile(`${testDir}/import.sol`, contractImport)
      createFile(`${testDir}/Util1.sol`, contractImport2)

      assert.throws(() => {
        contract.compile(testDir, 'import.sol', CompileType.BDK_SOLC)
      }, SolcError, 'Solidity Compile Error')
    })
  })

  describe('Besu.Contract.CompileLocalSolc', () => {
    before(() => {
      createFolder(testDir)
    })

    after(() => {
      deleteFolder(baseDir)
    })

    it('should have error when solc compile error', () => {
      createFile(`${testDir}/test.sol`)
      assert.throws(() => {
        contract.compile(testDir, 'test.sol', CompileType.LOCAL_SOLC)
      }, SolcError)
    })

    it('should return LocalSolc compile successfully', () => {
      createFile(`${testDir}/test.sol`, contractContent0_8_17)
      contract.compile(testDir, 'test.sol', CompileType.LOCAL_SOLC)
    })

    it('should return solc error when compile with not exist bytecode', () => {
      createFile(`${testDir}/test.sol`, contractContentNotExistBytecode)
      assert.throws(() => {
        contract.compile(testDir, 'test.sol', CompileType.LOCAL_SOLC)
      }, SolcError)
    })
  })

  describe('Besu.Contract.Deploy', () => {
    before(() => {
      createFolder(testDir)
    })

    after(() => {
      deleteFolder(baseDir)
    })

    it('Should return deploy error when contract json is invalid', async () => {
      createFile(`${testDeployDir}/test.json`, ContractInvalidJson)
      await assert.rejects(async () => {
        await contract.deploy(`${testDeployDir}/test.json`, privateKey, rpcUrl, params, '0')
      }, DeployError)
    })

    it('Should return deploy error when contract json is not exist abi or bytecode', async () => {
      createFile(`${testDeployDir}/test.json`, ContractInvalidFormat)
      await assert.rejects(async () => {
        await contract.deploy(`${testDeployDir}/test.json`, privateKey, rpcUrl, params, '0')
      }, DeployError)
    })

    it('should return deploy successfully', async () => {
      // Prepare test environment: Create a contract JSON file
      createFile(`${testDeployDir}/test.json`, ContractJson)

      // Define a mock contract object with a waitForDeployment method and a target address.
      const fakeContract: {
        waitForDeployment: sinon.SinonStub
        target: string | undefined
      } = {
        waitForDeployment: sinon.stub().callsFake(() => {
          fakeContract.target = '0x0000000000000000000000000000000000000002'
        }),
        target: undefined, // Initialize as undefined; it will be set by waitForDeployment.
      }

      // Define a mock Provider object with methods required for deployment.
      const fakeProvider = {
        getNetwork: sinon.stub().resolves({ chainId: 1337 } as any),
        getTransactionCount: sinon.stub().resolves(0),
        getBlockNumber: sinon.stub().resolves(100),
        getFeeData: sinon.stub().resolves({ gasPrice: 1000000000, maxFeePerGas: null, maxPriorityFeePerGas: null } as any),
      }

      // Define a mock Wallet object, ensuring its provider points to the mock Provider.
      const fakeWallet = {
        address: '0x0000000000000000000000000000000000000001',
        sendTransaction: sinon.stub().resolves({}),
        getAddress: sinon.stub().resolves('0x0000000000000000000000000000000000000001'),
        provider: fakeProvider, // Critical: Ensure the wallet uses the mock provider.
      }

      // Stub key dependencies:
      const walletStub = sinon.stub(contract, 'createWallet').returns(fakeWallet as any)
      const deployStub = sinon.stub(ethers.ContractFactory.prototype, 'deploy').returns(Promise.resolve(fakeContract as any))
      const createAddressStub = sinon.stub((contract as any).bdkFile, 'createContractAddress').returns(undefined)

      // Execute the deployment function under test.
      const result = await contract.deploy(`${testDeployDir}/test.json`, privateKey, rpcUrl, params, '0')

      // Assertions: Verify that stubs were called correctly and the result is as expected.
      sinon.assert.calledOnce(deployStub)
      sinon.assert.calledOnce(fakeContract.waitForDeployment)
      sinon.assert.calledOnce(createAddressStub) // Verify contract address was "written" to file.

      assert.strictEqual(result, '0x0000000000000000000000000000000000000002', 'Expected contract address to be 0x0000000000000000000000000000000000000002')

      // Restore all stubbed functions to prevent interference with other tests.
      walletStub.restore()
      deployStub.restore()
      createAddressStub.restore()
    })
  })
})

/**
 * 建立資料夾
 */
function createFolder (folderPath: string): void {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
}

/**
 * 建立檔案
 */
function createFile (filePath: string, content: string = ''): void {
  createFolder(path.dirname(filePath))
  fs.writeFileSync(filePath, content)
}

/**
 * 刪除資料夾
 */
function deleteFolder (folderPath: string): void {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true })
  }
}
