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

  // describe('approve', () => {
  // })

  // describe('approveSteps', () => {
  // })

  // describe('commit', () => {
  // })

  // describe('commitSteps', () => {
  // })

  // describe('getCommittedChaincode', () => {
  // })
})
