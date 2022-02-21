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

  // describe('invoke', () => {
  // })

  // describe('invokeSteps', () => {
  // })

  // describe('query', () => {
  // })

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

  // describe('getChaincodePackageId', () => {
  // })

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

  // describe('getCommittedChaincode', () => {
  // })
})
