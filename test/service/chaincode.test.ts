/* global describe, it, before, after, beforeEach, afterEach */
import fs from 'fs'
import assert from 'assert'
import config from '../../src/config'
import Chaincode from '../../src/service/chaincode'
import MinimumNetwork from '../util/minimumNetwork'

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

  // describe('install', () => {
  // })

  // describe('installSteps', () => {
  // })

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
