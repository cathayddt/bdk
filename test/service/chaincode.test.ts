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

  // describe('commit', () => {
  // })

  // describe('commitSteps', () => {
  // })

  // describe('getCommittedChaincode', () => {
  // })
})
