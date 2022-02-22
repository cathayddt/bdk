/* global describe, it, before, after, beforeEach, afterEach */
import fs from 'fs'
import assert from 'assert'
import config from '../../src/config'
import Chaincode from '../../src/service/chaincode'
import MinimumNetwork from '../util/minimumNetwork'
import sinon from 'sinon'
import { DockerResultType } from '../../src/instance/infra/InfraRunner.interface'

describe('Chaincode service:', function () {
  this.timeout(60000)

  let minimumNetwork: MinimumNetwork
  let chaincodeService: Chaincode
  let chaincodeServiceOrg0Peer: Chaincode

  before(() => {
    minimumNetwork = new MinimumNetwork()
    chaincodeService = new Chaincode(config)
    chaincodeServiceOrg0Peer = new Chaincode(minimumNetwork.org0PeerConfig)
  })

  describe('package', () => {
    it('should package chaincode', async () => {
      await chaincodeService.package({
        name: 'fabcar',
        version: 1,
        path: './chaincode/fabcar/go',
      })
      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/chaincode/fabcar_1.tar.gz`), true)
    })
  })

  describe('invoke', () => {
    it('should use invokeSteps', async () => {
      const chaincodeInvokeStepDiscoverEndorsersStub = sinon.stub().resolves({ stdout: '' })
      const chaincodeInvokeStepDiscoverChannelConfigStub = sinon.stub().resolves({ stdout: '' })
      const chaincodeInvokeStepInvokeOnInstanceStub = sinon.stub().resolves()
      const chaincodeInvokeStepsStub = sinon.stub(Chaincode.prototype, 'invokeSteps').callsFake(() => ({
        discoverEndorsers: chaincodeInvokeStepDiscoverEndorsersStub,
        discoverChannelConfig: chaincodeInvokeStepDiscoverChannelConfigStub,
        invokeOnInstance: chaincodeInvokeStepInvokeOnInstanceStub,
      }))
      const chaincodeParserInvokeStepDiscoverEndorsersStub = sinon.stub(Chaincode.parser, 'invokeStepDiscoverEndorsers').returns([''])
      const chaincodeParserInvokeStepDiscoverChannelConfigStub = sinon.stub(Chaincode.parser, 'invokeStepDiscoverChannelConfig').returns('')
      await chaincodeService.invoke({
        channelId: minimumNetwork.chaincodeName,
        chaincodeName: 'fabcar',
        chaincodeFunction: 'CreateCar',
        args: ['CAR_ORG0_PEER0', 'BMW', 'X6', 'blue', 'Org1'],
        isInit: false,
      })
      assert.deepStrictEqual(chaincodeInvokeStepDiscoverEndorsersStub.called, true)
      assert.deepStrictEqual(chaincodeInvokeStepDiscoverChannelConfigStub.called, true)
      assert.deepStrictEqual(chaincodeInvokeStepInvokeOnInstanceStub.called, true)
      chaincodeInvokeStepsStub.restore()
      chaincodeParserInvokeStepDiscoverEndorsersStub.restore()
      chaincodeParserInvokeStepDiscoverChannelConfigStub.restore()
    })
  })

  describe('invokeSteps', () => {
    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      await minimumNetwork.deployChaincode()
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('discoverEndorsers', () => {
      it('should discover endorsers', async () => {
        const result = await chaincodeServiceOrg0Peer.invokeSteps().discoverEndorsers({
          channelId: minimumNetwork.channelName,
          chaincodeName: minimumNetwork.chaincodeName,
          chaincodeFunction: 'CreateCar',
          args: ['CAR_ORG0_PEER0', 'BMW', 'X6', 'blue', 'Org1'],
          isInit: false,
        }) as DockerResultType
        assert.deepStrictEqual(Chaincode.parser.invokeStepDiscoverEndorsers(result), [`${minimumNetwork.getPeer().hostname}.${minimumNetwork.getPeer().orgDomain}:${minimumNetwork.getPeer().port}`])
      })
    })

    describe('discoverChannelConfig', () => {
      it('should discover channel config', async () => {
        const result = await chaincodeServiceOrg0Peer.invokeSteps().discoverChannelConfig({
          channelId: minimumNetwork.channelName,
          chaincodeName: minimumNetwork.chaincodeName,
          chaincodeFunction: 'CreateCar',
          args: ['CAR_ORG0_PEER0', 'BMW', 'X6', 'blue', 'Org1'],
          isInit: false,
        }) as DockerResultType
        assert.deepStrictEqual(Chaincode.parser.invokeStepDiscoverChannelConfig(result), minimumNetwork.getOrderer().fullUrl)
      })
    })

    describe('invokeOnInstance', () => {
      let orderer: string
      let peerAddresses: string[]

      before(async () => {
        const discoverEndorsersResult = await chaincodeServiceOrg0Peer.invokeSteps().discoverEndorsers({
          channelId: minimumNetwork.channelName,
          chaincodeName: minimumNetwork.chaincodeName,
          chaincodeFunction: 'CreateCar',
          args: ['CAR_ORG0_PEER0', 'BMW', 'X6', 'blue', 'Org1'],
          isInit: false,
        }) as DockerResultType
        peerAddresses = Chaincode.parser.invokeStepDiscoverEndorsers(discoverEndorsersResult)
        const discoverChannelConfigResult = await chaincodeServiceOrg0Peer.invokeSteps().discoverChannelConfig({
          channelId: minimumNetwork.channelName,
          chaincodeName: minimumNetwork.chaincodeName,
          chaincodeFunction: 'CreateCar',
          args: ['CAR_ORG0_PEER0', 'BMW', 'X6', 'blue', 'Org1'],
          isInit: false,
        }) as DockerResultType
        orderer = Chaincode.parser.invokeStepDiscoverChannelConfig(discoverChannelConfigResult)
      })

      it('should invoke on instance', async () => {
        const result = await chaincodeServiceOrg0Peer.invokeSteps().invokeOnInstance({
          channelId: minimumNetwork.channelName,
          chaincodeName: minimumNetwork.chaincodeName,
          chaincodeFunction: 'CreateCar',
          args: ['CAR_ORG0_PEER0', 'BMW', 'X6', 'blue', 'Org1'],
          isInit: false,
          orderer,
          peerAddresses,
        }) as DockerResultType
        assert.match(result.stdout, /txid \[.*\] committed with status \(VALID\) at peer0.org0.bdk.example.com:7051/)
        assert.match(result.stdout, /Chaincode invoke successful. result: status:200/)
        assert.deepStrictEqual(Chaincode.parser.invoke(result), {})
      })
    })
  })

  describe('query', () => {
    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      await minimumNetwork.deployChaincode()
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    it('should query chaincode', async () => {
      const result = await chaincodeServiceOrg0Peer.query({
        channelId: minimumNetwork.channelName,
        chaincodeName: minimumNetwork.chaincodeName,
        chaincodeFunction: 'queryAllCars',
        args: [],
      }) as DockerResultType
      assert.deepStrictEqual(Chaincode.parser.query(result), [{ Key: 'CAR0', Record: { make: 'Toyota', model: 'Prius', colour: 'blue', owner: 'Tomoko' } }, { Key: 'CAR1', Record: { make: 'Ford', model: 'Mustang', colour: 'red', owner: 'Brad' } }, { Key: 'CAR2', Record: { make: 'Hyundai', model: 'Tucson', colour: 'green', owner: 'Jin Soo' } }, { Key: 'CAR3', Record: { make: 'Volkswagen', model: 'Passat', colour: 'yellow', owner: 'Max' } }, { Key: 'CAR4', Record: { make: 'Tesla', model: 'S', colour: 'black', owner: 'Adriana' } }, { Key: 'CAR5', Record: { make: 'Peugeot', model: '205', colour: 'purple', owner: 'Michel' } }, { Key: 'CAR6', Record: { make: 'Chery', model: 'S22L', colour: 'white', owner: 'Aarav' } }, { Key: 'CAR7', Record: { make: 'Fiat', model: 'Punto', colour: 'violet', owner: 'Pari' } }, { Key: 'CAR8', Record: { make: 'Tata', model: 'Nano', colour: 'indigo', owner: 'Valeria' } }, { Key: 'CAR9', Record: { make: 'Holden', model: 'Barina', colour: 'brown', owner: 'Shotaro' } }])
    })
  })

  describe('install', () => {
    it('should use installSteps', async () => {
      const chaincodeInstallStepInstallToPeerStub = sinon.stub().resolves({ stdout: '' })
      const chaincodeInstallStepSavePackageIdStub = sinon.stub().returns(undefined)
      const chaincodeInstallStepsStub = sinon.stub(Chaincode.prototype, 'installSteps').callsFake(() => ({
        installToPeer: chaincodeInstallStepInstallToPeerStub,
        savePackageId: chaincodeInstallStepSavePackageIdStub,
      }))
      await chaincodeService.install({
        chaincodeLabel: 'fabcar_1',
      })
      assert.deepStrictEqual(chaincodeInstallStepInstallToPeerStub.called, true)
      assert.deepStrictEqual(chaincodeInstallStepSavePackageIdStub.called, true)
      chaincodeInstallStepsStub.restore()
    })
  })

  describe('installSteps', () => {
    beforeEach(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      await chaincodeService.package({
        name: 'fabcar',
        version: 1,
        path: './chaincode/fabcar/go',
      })
    })

    afterEach(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('installToPeer', () => {
      it('should install chaincode to Peer', async () => {
        await chaincodeServiceOrg0Peer.installSteps().installToPeer({
          chaincodeLabel: 'fabcar_1',
        })
        assert.match(Chaincode.parser.getChaincodePackageId(await chaincodeServiceOrg0Peer.getChaincodePackageId() as DockerResultType, { chaincodeLabel: 'fabcar_1' }), /^fabcar_1:.*$/)
      })
    })

    describe('savePackageId', () => {
      let packageId: string
      beforeEach(async () => {
        const installReslult = await chaincodeServiceOrg0Peer.installSteps().installToPeer({
          chaincodeLabel: 'fabcar_1',
        }) as DockerResultType
        packageId = Chaincode.parser.installToPeer(installReslult, { chaincodeLabel: 'fabcar_1' })
      })

      it('should save package id', () => {
        chaincodeServiceOrg0Peer.installSteps().savePackageId({
          chaincodeLabel: 'fabcar_1',
          packageId,
        })
        assert.deepStrictEqual(fs.readFileSync(`${config.infraConfig.bdkPath}/${config.networkName}/chaincode/package-id/fabcar_1`).toString(), packageId)
      })
    })
  })

  describe('getChaincodePackageId', () => {
    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      await minimumNetwork.deployChaincode()
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    it('should get chaincode package id', async () => {
      const result = await chaincodeServiceOrg0Peer.getChaincodePackageId() as DockerResultType
      assert.match(Chaincode.parser.getChaincodePackageId(result, { chaincodeLabel: `${minimumNetwork.chaincodeName}_1` }), RegExp(`^${minimumNetwork.chaincodeName}_1:\\w{64}$`))
    })
  })

  describe('approve', () => {
    it('should use approveSteps', async () => {
      const chaincodeApproveStepDiscoverStub = sinon.stub().resolves({ stdout: '' })
      const chaincodeApproveStepApproveOnInstanceStub = sinon.stub().resolves()
      const chaincodeApproveStepsStub = sinon.stub(Chaincode.prototype, 'approveSteps').callsFake(() => ({
        discover: chaincodeApproveStepDiscoverStub,
        approveOnInstance: chaincodeApproveStepApproveOnInstanceStub,
      }))
      const chaincodeParserApproveStepDiscoverStub = sinon.stub(Chaincode.parser, 'approveStepDiscover').returns('')
      await chaincodeService.approve({
        channelId: minimumNetwork.chaincodeName,
        chaincodeName: 'fabcar',
        chaincodeVersion: 1,
        initRequired: true,
      })
      assert.deepStrictEqual(chaincodeApproveStepDiscoverStub.called, true)
      assert.deepStrictEqual(chaincodeApproveStepApproveOnInstanceStub.called, true)
      chaincodeApproveStepsStub.restore()
      chaincodeParserApproveStepDiscoverStub.restore()
    })
  })

  describe('approveSteps', () => {
    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      await chaincodeService.package({
        name: 'fabcar',
        version: 1,
        path: './chaincode/fabcar/go',
      })
      await chaincodeServiceOrg0Peer.install({
        chaincodeLabel: 'fabcar_1',
      })
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('discover', () => {
      it('should discover orderer for approve', async () => {
        const result = await chaincodeServiceOrg0Peer.approveSteps().discover({
          channelId: minimumNetwork.channelName,
          chaincodeName: 'fabcar',
          chaincodeVersion: 1,
          initRequired: true,
        }) as DockerResultType
        assert.deepStrictEqual(Chaincode.parser.approveStepDiscover(result), minimumNetwork.getOrderer().fullUrl)
      })
    })

    describe('approveOnInstance', () => {
      let orderer: string

      before(async () => {
        const discoverResult = await chaincodeServiceOrg0Peer.approveSteps().discover({
          channelId: minimumNetwork.channelName,
          chaincodeName: 'fabcar',
          chaincodeVersion: 1,
          initRequired: true,
        }) as DockerResultType
        orderer = Chaincode.parser.approveStepDiscover(discoverResult)
      })

      it('should approve on instance', async () => {
        const result = await chaincodeServiceOrg0Peer.approveSteps().approveOnInstance({
          channelId: minimumNetwork.channelName,
          chaincodeName: 'fabcar',
          chaincodeVersion: 1,
          initRequired: true,
          orderer,
        }) as DockerResultType
        assert.match(result.stdout, /txid \[.*\] committed with status \(VALID\) at peer0.org0.bdk.example.com:7051\r\n$/)
      })
    })
  })

  describe('commit', () => {
    it('should use commitSteps', async () => {
      const chaincodeCommitStepDiscoverChannelConfigStub = sinon.stub().resolves({ stdout: '' })
      const chaincodeCommitStepDiscoverPeersStub = sinon.stub().resolves({ stdout: '' })
      const chaincodeCommitStepCommitOnInstanceStub = sinon.stub().resolves()
      const chaincodeCommitStepsStub = sinon.stub(Chaincode.prototype, 'commitSteps').callsFake(() => ({
        discoverChannelConfig: chaincodeCommitStepDiscoverChannelConfigStub,
        discoverPeers: chaincodeCommitStepDiscoverPeersStub,
        commitOnInstance: chaincodeCommitStepCommitOnInstanceStub,
      }))
      const chaincodeParserCommitStepDiscoverChannelConfigStub = sinon.stub(Chaincode.parser, 'commitStepDiscoverChannelConfig').returns('')
      const chaincodeParserCommitStepDiscoverPeersStub = sinon.stub(Chaincode.parser, 'commitStepDiscoverPeers').returns([''])
      await chaincodeService.commit({
        channelId: minimumNetwork.chaincodeName,
        chaincodeName: 'fabcar',
        chaincodeVersion: 1,
        initRequired: true,
      })
      assert.deepStrictEqual(chaincodeCommitStepDiscoverChannelConfigStub.called, true)
      assert.deepStrictEqual(chaincodeCommitStepDiscoverPeersStub.called, true)
      assert.deepStrictEqual(chaincodeCommitStepCommitOnInstanceStub.called, true)
      chaincodeCommitStepsStub.restore()
      chaincodeParserCommitStepDiscoverChannelConfigStub.restore()
      chaincodeParserCommitStepDiscoverPeersStub.restore()
    })
  })

  describe('commitSteps', () => {
    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      await chaincodeService.package({
        name: 'fabcar',
        version: 1,
        path: './chaincode/fabcar/go',
      })
      await chaincodeServiceOrg0Peer.install({
        chaincodeLabel: 'fabcar_1',
      })
      await chaincodeServiceOrg0Peer.approve({
        channelId: minimumNetwork.channelName,
        chaincodeName: 'fabcar',
        chaincodeVersion: 1,
        initRequired: true,
      })
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('discoverChannelConfig', () => {
      it('should discover orderer for commit', async () => {
        const result = await chaincodeServiceOrg0Peer.commitSteps().discoverChannelConfig({
          channelId: minimumNetwork.channelName,
          chaincodeName: 'fabcar',
          chaincodeVersion: 1,
          initRequired: true,
        }) as DockerResultType
        assert.deepStrictEqual(Chaincode.parser.commitStepDiscoverChannelConfig(result), minimumNetwork.getOrderer().fullUrl)
      })
    })

    describe('discoverPeers', () => {
      it('should discover peers for commit', async () => {
        const result = await chaincodeServiceOrg0Peer.commitSteps().discoverPeers({
          channelId: minimumNetwork.channelName,
          chaincodeName: 'fabcar',
          chaincodeVersion: 1,
          initRequired: true,
        }) as DockerResultType
        assert.deepStrictEqual(Chaincode.parser.commitStepDiscoverPeers(result), [`${minimumNetwork.getPeer().hostname}.${minimumNetwork.getPeer().orgDomain}:${minimumNetwork.getPeer().port}`])
      })
    })

    describe('commitOnInstance', () => {
      let orderer: string
      let peerAddresses: string[]

      before(async () => {
        const discoverChanelConfigResult = await chaincodeServiceOrg0Peer.commitSteps().discoverChannelConfig({
          channelId: minimumNetwork.channelName,
          chaincodeName: 'fabcar',
          chaincodeVersion: 1,
          initRequired: true,
        }) as DockerResultType
        orderer = Chaincode.parser.commitStepDiscoverChannelConfig(discoverChanelConfigResult)
        const discoverPeersResult = await chaincodeServiceOrg0Peer.commitSteps().discoverPeers({
          channelId: minimumNetwork.channelName,
          chaincodeName: 'fabcar',
          chaincodeVersion: 1,
          initRequired: true,
        }) as DockerResultType
        peerAddresses = Chaincode.parser.commitStepDiscoverPeers(discoverPeersResult)
      })

      it('should commit on instance', async () => {
        const result = await chaincodeServiceOrg0Peer.commitSteps().commitOnInstance({
          channelId: minimumNetwork.channelName,
          chaincodeName: 'fabcar',
          chaincodeVersion: 1,
          initRequired: true,
          orderer,
          peerAddresses,
        }) as DockerResultType
        assert.match(result.stdout, /txid \[.*\] committed with status \(VALID\) at peer0.org0.bdk.example.com:7051\r\n$/)
      })
    })
  })

  describe('getCommittedChaincode', () => {
    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      await minimumNetwork.deployChaincode()
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    it('should get all committed chaincode', async () => {
      const result = await chaincodeServiceOrg0Peer.getCommittedChaincode(minimumNetwork.channelName) as DockerResultType
      assert.deepStrictEqual(Chaincode.parser.getCommittedChaincode(result), [minimumNetwork.chaincodeName])
    })
  })
})
