/* global describe, it, before, after, beforeEach */
import Dockerode from 'dockerode'
import assert from 'assert'
import sinon from 'sinon'
import Network from '../../../../src/eth/service/network'
import config from '../../../../src/eth/config'
import fs from 'fs'
import { resolve } from 'path'
import { sleep, TimeLimitError } from '../../../../src/util'
import { JoinNodeType } from '../../../../src/eth/model/type/network.type'
import Wallet from '../../../../src/wallet/service/wallet'
import { WalletType } from '../../../../src/wallet/model/type/wallet.type'
import { NetworkType } from '../../../../src/eth/config/network.type'

describe('Besu.Network.Service', function () {
  this.timeout(1000000)

  const docker = new Dockerode({ socketPath: '/var/run/docker.sock' })
  const dockerdOption = { all: true }
  const bdkPath = 'test/bdk'
  const filePath = resolve(`${bdkPath}/bdk-besu-network`)

  const network = new Network(config, 'besu')
  const wallet = new Wallet()
  const { address } = wallet.createWalletAddress(WalletType.ETHEREUM)
  const networkCreateConfig = {
    networkType: NetworkType.BESU,
    validatorNumber: 2,
    memberNumber: 2,
    chainId: 1234,
    alloc: [{
      account: address,
      amount: '1000000000000000000000000000',
    }],
    isBootNode: false,
    bootNodeList: [false, false, false, false],
  }

  before(async () => {
    const allContainers = await docker.listContainers()
    const bdkBesuContainers = allContainers.filter((container) => {
      return container.NetworkSettings.Networks['bdk-besu-network_besu'] !== undefined
    })

    // Stop and remove containers connected to the bdk-besu network
    for (const containerInfo of bdkBesuContainers) {
      const container = docker.getContainer(containerInfo.Id)
      await container.stop()
      await container.remove()
    }
    await network.create(networkCreateConfig)
  })

  after(async () => {
    await network.delete()
  })

  describe('Besu.Network.create', () => {
    beforeEach(async () => {
      await network.delete()
      await sleep(1000)
    })

    it('should create the bdk files', async () => {
      await network.createBdkFolder()
      assert(fs.existsSync(filePath))
    })

    it('should create and start the network', async () => {
      const initContainers = await docker.listContainers(dockerdOption)
      await network.create(networkCreateConfig)
      const upContainers = await docker.listContainers(dockerdOption)

      assert.strictEqual(upContainers.length, initContainers.length + 4)
      const validatorContainers = upContainers.filter((container) =>
        container.Names.some((name) => name.includes('validator')),
      )
      const memberContainers = upContainers.filter((container) =>
        container.Names.some((name) => name.includes('member')),
      )

      assert.strictEqual(validatorContainers.length, 2, 'Not all validator containers are running')
      assert.strictEqual(memberContainers.length, 2, 'Not all member containers are running')
    })

    it('should create only validator containers', async () => {
      const onlyMemberConfig = {
        validatorNumber: 2,
        memberNumber: 0,
        chainId: 1234,
        alloc: [],
        isBootNode: false,
        bootNodeList: [false, false],
      }
      await network.create(onlyMemberConfig)
      const upContainers = await docker.listContainers(dockerdOption)
      const memberContainers = upContainers.filter((container) =>
        container.Names.some((name) => name.includes('member')),
      )
      assert.strictEqual(memberContainers.length, 0, 'Member containers are running')
    })
  })

  describe('Besu.Network.generate', () => {
    before(async () => {
      await network.delete()
    })

    it('should generate the expected number of validators and members', async () => {
      await network.generate(networkCreateConfig)

      const nodeFiles = fs.readdirSync(filePath)

      assert.strictEqual(nodeFiles.filter(file => file.match(/(validator)[0-9]+/g)).length, networkCreateConfig.validatorNumber)
      assert.strictEqual(nodeFiles.filter(file => file.match(/(member)[0-9]+/g)).length, networkCreateConfig.memberNumber)
    })
  })

  describe('Besu.Network.add', () => {
    beforeEach(async () => {
      await network.delete()
      await network.create(networkCreateConfig)
    })

    describe('Besu.Network.addValidatorLocal', () => {
      it('should add a new validator locally', async () => {
        await sleep(60000)
        const validatorNumBefore = fs.readdirSync(filePath).filter(file => file.match(/(validator)[0-9]+/g)).length

        const newValidatorNum = await network.addValidatorLocal(NetworkType.BESU)

        const validatorNumAfter = fs.readdirSync(filePath).filter(file => file.match(/(validator)[0-9]+/g)).length
        assert.strictEqual(validatorNumAfter, validatorNumBefore + 1)
        assert.strictEqual(newValidatorNum, validatorNumBefore)
      })

      it('should throw timeout Error', async () => {
        await sleep(60000)
        const stub = sinon.stub(network, 'besuCommand' as keyof Network).resolves('[]')
        await assert.rejects(async () => { await network.addValidatorLocal(NetworkType.BESU) }, TimeLimitError)
        stub.restore()
      })
    })

    describe('Besu.Network.addMemberLocal', () => {
      it('should add a new member locally', async () => {
        await sleep(60000)
        const memberNumBefore = fs.readdirSync(filePath).filter(file => file.match(/(member)[0-9]+/g)).length
        const newMemberNum = await network.addMemberLocal(NetworkType.BESU)

        const memberNumAfter = fs.readdirSync(filePath).filter(file => file.match(/(member)[0-9]+/g)).length
        assert.strictEqual(memberNumAfter, memberNumBefore + 1)
        assert.strictEqual(newMemberNum, memberNumBefore)
      })

      it('should throw timeout Error', async () => {
        await sleep(60000)
        const stub = sinon.stub(network, 'besuCommand' as keyof Network).resolves('0')
        await assert.rejects(async () => { await network.addMemberLocal(NetworkType.BESU) }, TimeLimitError)
        stub.restore()
      })
    })

    describe('Besu.Network.addValidatorRemote', () => {
      const remoteValidatorPublicKey = 'REMOTE_VALIDATOR_PUBLIC_KEY'
      const remoteValidatorAddress = 'REMOTE_VALIDATOR_ADDRESS'
      const remoteIpAddress = 'REMOTE_IP_ADDRESS'
      const remoteDiscoveryPort = '30303'
      it('should add a remote validator to the network', async () => {
        await network.addValidatorRemote({
          validatorPublicKey: remoteValidatorPublicKey,
          validatorAddress: remoteValidatorAddress,
          ipAddress: remoteIpAddress,
          discoveryPort: remoteDiscoveryPort,
        }, NetworkType.BESU)
        const staticNodesJson = network.getNetworkInfo('static-nodes.json')
        assert.strictEqual(staticNodesJson?.includes(remoteValidatorPublicKey), true)
      })
    })

    describe('Besu.Network.addMemberRemote', () => {
      const remoteMemberAddress = 'REMOTE_MEMBER_ADDRESS'
      const remoteMemberPublicKey = 'REMOTE_MEMBER_PUBLIC_KEY'
      const remoteMemberIpAddress = 'REMOTE_MEMBER_IP_ADDRESS'
      const remoteMemberDiscoveryPort = '30403'
      it('should add a remote member to the network', async () => {
        await network.addMemberRemote({
          memberAddress: remoteMemberAddress,
          memberPublicKey: remoteMemberPublicKey,
          ipAddress: remoteMemberIpAddress,
          discoveryPort: remoteMemberDiscoveryPort,
        })
        const staticNodesJson = network.getNetworkInfo('static-nodes.json')
        assert.strictEqual(staticNodesJson?.includes(remoteMemberPublicKey), true)
      })
    })

    describe('Besu.Network.joinNode', () => {
      const ipAddress = '127.0.0.1'

      it('should join a validator node successfully', async () => {
        await network.down()
        await network.upService('validator0')

        const genesisJson = network.getNetworkInfo('genesis.json')
        const staticNodesJson = network.getNetworkInfo('static-nodes.json')

        await network.addValidatorRemote({
          validatorPublicKey: fs.readFileSync(`${filePath}/artifacts/validator1/nodekey.pub`, 'utf8'),
          validatorAddress: fs.readFileSync(`${filePath}/artifacts/validator1/address`, 'utf8'),
          ipAddress,
          discoveryPort: '30303',
        }, NetworkType.BESU)
        const joinNodeConfig: JoinNodeType = {
          node: 'validator1',
          ipAddress: ipAddress,
          genesisJson: JSON.parse(genesisJson as string),
          staticNodesJson: JSON.parse(staticNodesJson as string),
        }
        const besuStub = sinon.stub(network, 'besuCommand' as keyof Network).resolves(`['0x${address}']`)
        await network.joinNode(NetworkType.BESU, joinNodeConfig)
        besuStub.restore()

        const allContainers = await docker.listContainers()
        const bdkBesuContainers = allContainers.filter((container) => {
          return container.NetworkSettings.Networks['bdk-besu-network_besu'] !== undefined
        })
        assert.strictEqual(bdkBesuContainers.length, 2)
      })

      it('should join a member node successfully', async () => {
        await network.down()
        await network.upService('validator0')
        const genesisJson = network.getNetworkInfo('genesis.json')
        const staticNodesJson = network.getNetworkInfo('static-nodes.json')

        await network.addMemberRemote({
          memberPublicKey: fs.readFileSync(`${filePath}/artifacts/member1/nodekey.pub`, 'utf8'),
          memberAddress: fs.readFileSync(`${filePath}/artifacts/member1/address`, 'utf8'),
          ipAddress,
          discoveryPort: '30403',
        })
        const joinNodeConfig: JoinNodeType = {
          node: 'member1',
          ipAddress: ipAddress,
          genesisJson: JSON.parse(genesisJson as string),
          staticNodesJson: JSON.parse(staticNodesJson as string),
        }
        const besuStub = sinon.stub(network, 'besuCommand' as keyof Network).resolves(`['0x${address}']`)
        await network.joinNode(NetworkType.BESU, joinNodeConfig)
        besuStub.restore()

        const allContainers = await docker.listContainers()
        const bdkBesuContainers = allContainers.filter((container) => {
          return container.NetworkSettings.Networks['bdk-besu-network_besu'] !== undefined
        })
        assert.strictEqual(bdkBesuContainers.length, 2)
      })

      it('should throw timeout Error when join validator', async () => {
        const genesisJson = network.getNetworkInfo('genesis.json')
        const staticNodesJson = network.getNetworkInfo('static-nodes.json')
        const joinNodeConfig: JoinNodeType = {
          node: 'validator1',
          ipAddress: ipAddress,
          genesisJson: JSON.parse(genesisJson as string),
          staticNodesJson: JSON.parse(staticNodesJson as string),
        }
        const besuStub = sinon.stub(network, 'besuCommand' as keyof Network).resolves('false')
        await assert.rejects(async () => { await network.joinNode(NetworkType.BESU, joinNodeConfig) }, TimeLimitError)
        besuStub.restore()
      })

      it('should throw timeout Error when join member', async () => {
        const genesisJson = network.getNetworkInfo('genesis.json')
        const staticNodesJson = network.getNetworkInfo('static-nodes.json')
        const joinNodeConfig: JoinNodeType = {
          node: 'member1',
          ipAddress: ipAddress,
          genesisJson: JSON.parse(genesisJson as string),
          staticNodesJson: JSON.parse(staticNodesJson as string),
        }
        await sleep(1000)
        const besuStub = sinon.stub(network, 'besuCommand' as keyof Network).resolves('0')
        await assert.rejects(async () => { await network.joinNode(NetworkType.BESU, joinNodeConfig) }, TimeLimitError)
        besuStub.restore()
      })
    })
  })

  describe('Besu.Network.dockerService', () => {
    beforeEach(async () => {
      await network.delete()
      await sleep(1000)
      await network.create(networkCreateConfig)
      await sleep(1000)
    })
    describe('Besu.Network.upAll', () => {
      it('should start all containers', async () => {
        await network.down()
        await sleep(1000)
        await network.upAll()
        await sleep(3000)
        const allContainers = await docker.listContainers(dockerdOption)
        const bdkBesuContainers = allContainers.filter((container) => {
          return container.NetworkSettings.Networks['bdk-besu-network_besu'] !== undefined
        })

        const totalNodes = networkCreateConfig.validatorNumber + networkCreateConfig.memberNumber
        assert.strictEqual(bdkBesuContainers.length, totalNodes)

        const nodeList = await network.getUpExportItems()
        assert.strictEqual(nodeList.length, totalNodes)
      })
    })

    describe('Besu.Network.down', () => {
      it('should stop all containers', async () => {
        await sleep(1000)
        await network.down()
        await sleep(1000)

        const allContainersAfterDown = await docker.listContainers(dockerdOption)
        const bdkBesuContainersAfterDown = allContainersAfterDown.filter((container) => {
          return container.NetworkSettings.Networks['bdk-besu-network_besu'] !== undefined
        })

        assert.strictEqual(bdkBesuContainersAfterDown.length, 0)
      })
    })

    describe('Besu.Network.upService', () => {
      it('should start one specific containers', async () => {
        await network.down()
        await sleep(1000)
        await network.upService('validator0')
        await network.upService('member0')
        await sleep(1000)
        const allContainers = await docker.listContainers(dockerdOption)
        const bdkBesuContainers = allContainers.filter((container) => {
          return container.NetworkSettings.Networks['bdk-besu-network_besu'] !== undefined
        })

        assert.strictEqual(bdkBesuContainers.length, 2)
      })
      it('should up nothing when input wrong', async () => {
        await network.down()
        await network.upService('test')
        const allContainers = await docker.listContainers(dockerdOption)
        const bdkBesuContainers = allContainers.filter((container) => {
          return container.NetworkSettings.Networks['bdk-besu-network_besu'] !== undefined
        })
        assert.strictEqual(bdkBesuContainers.length, 0)
      })
    })
    describe('Besu.Network.delete', () => {
      it('should start one specific container', async () => {
        await network.create(networkCreateConfig)
        await sleep(1000)
        await network.delete()
        await sleep(1000)
        const allContainers = await docker.listContainers(dockerdOption)
        const bdkBesuContainers = allContainers.filter((container) => {
          return container.NetworkSettings.Networks['bdk-besu-network_besu'] !== undefined
        })

        const fileList = await network.getBdkFiles()
        assert.strictEqual(bdkBesuContainers.length, 0)
        assert.strictEqual(fileList.length, 0)
      })
    })
  })

  describe('Besu.Network.getNetworkInfo', () => {
    let newValidatorNum: number
    let newMemberNum: number

    before(async () => {
      await network.delete()
      // Add a local validator and member before testing getNetworkInfo and getNodeInfo
      await network.create(networkCreateConfig)
      newValidatorNum = await network.addValidatorLocal(NetworkType.BESU)
      newMemberNum = await network.addMemberLocal(NetworkType.BESU)
    })

    it('should get the correct network information', () => {
      const genesisJson = network.getNetworkInfo('genesis.json')
      const staticNodesJson = network.getNetworkInfo('static-nodes.json')
      const permissionedNodesJson = network.getNetworkInfo('permissioned-nodes.json')
      const totalNodes = networkCreateConfig.validatorNumber + networkCreateConfig.memberNumber + 2

      assert.strictEqual(JSON.parse(genesisJson as string).nonce, '0x0')
      assert.strictEqual(JSON.parse(staticNodesJson as string).length, totalNodes)
      assert.strictEqual(JSON.parse(permissionedNodesJson as string).length, totalNodes)
    })

    it('should get the correct validator node information', () => {
      const validatorNode = `validator${newValidatorNum}`

      const validatorAddress = network.getNodeInfo(validatorNode, 'address')
      const validatorPublicKey = network.getNodeInfo(validatorNode, 'publicKey')
      const validatorPrivateKey = network.getNodeInfo(validatorNode, 'privateKey')
      const validatorEnodeInfo = network.getNodeInfo(validatorNode, 'enodeInfo')

      assert.strictEqual(typeof validatorAddress, 'object')
      assert.strictEqual(typeof validatorPublicKey, 'object')
      assert.strictEqual(typeof validatorPrivateKey, 'object')
      assert.strictEqual(typeof validatorEnodeInfo, 'string')
    })

    it('should get the correct member node information', () => {
      const memberNode = `member${newMemberNum}`

      const memberAddress = network.getNodeInfo(memberNode, 'address')
      const memberPublicKey = network.getNodeInfo(memberNode, 'publicKey')
      const memberPrivateKey = network.getNodeInfo(memberNode, 'privateKey')
      const memberEnodeInfo = network.getNodeInfo(memberNode, 'enodeInfo')

      assert.strictEqual(typeof memberAddress, 'object')
      assert.strictEqual(typeof memberPublicKey, 'object')
      assert.strictEqual(typeof memberPrivateKey, 'object')
      assert.strictEqual(typeof memberEnodeInfo, 'string')
    })
    it('should get undefined when wrong input', () => {
      const wrongResult = network.getNodeInfo('test', 'test')
      assert.strictEqual(wrongResult, undefined)
    })
  })
})
