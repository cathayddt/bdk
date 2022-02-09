/* global describe, it, before, after */
import fs from 'fs'
import assert from 'assert'
import net from 'net'
import sinon from 'sinon'
import config from '../../src/config'
import Orderer from '../../src/service/orderer'
import { NetworkCreateOrdererOrgType } from '../../src/model/type/network.type'
import MinimumNetwork from '../util/minimumNetwork'

describe('Orderer service:', function () {
  this.timeout(60000)

  let minimumNetwork: MinimumNetwork
  let orgOrdererCreateJson: NetworkCreateOrdererOrgType[]
  let ordererService: Orderer
  let ordererServiceOrg0Orderer: Orderer

  before(() => {
    minimumNetwork = new MinimumNetwork()
    ordererService = new Orderer(config)
    ordererServiceOrg0Orderer = new Orderer(minimumNetwork.org0OrdererConfig)
    orgOrdererCreateJson = JSON.parse(fs.readFileSync('./cicd/test_script/org-orderer-create.json').toString())
  })

  describe('up & down', () => {
    before(async () => {
      await minimumNetwork.createNetwork()
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    it('should start and shutdown docker container', (done) => {
      const ordererHostname = `${minimumNetwork.getOrderer().hostname}.${minimumNetwork.getOrderer().orgDomain}`
      const port = minimumNetwork.getOrderer().port

      ordererService.up({ ordererHostname }).then(() => {
        const socket = net.connect(port, '127.0.0.1', () => {
          ordererService.down({ ordererHostname })
            .then(() => {
              // TODO check container
              done()
            })
            .catch((err) => {
              assert.fail(`orderer down error: ${err.message}`)
            })
        })

        socket.on('error', (err) => {
          assert.fail(`orderer connect test error: ${err.message}`)
        })
      }).catch((err) => {
        assert.fail(`orderer up error: ${err.message}`)
      })
    })
  })

  describe('cryptogen', () => {
    before(() => {
      minimumNetwork.createNetworkFolder()
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    it('should generate orderer ca file when function cryptogen done', async () => {
      await ordererService.cryptogen({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'newest_genesis' })

      /**
       * config-yaml
       */
      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/config-yaml/crypto-config.yaml`), true)

      /**
       * ordererOrganizations
       */
      orgOrdererCreateJson.forEach((ordererOrg) => {
        const ordererOrgPath = `${config.infraConfig.bdkPath}/${config.networkName}/ordererOrganizations/${ordererOrg.domain}`

        // folder
        assert.strictEqual(fs.existsSync(`${ordererOrgPath}`), true)

        // ca
        assert.strictEqual(fs.existsSync(`${ordererOrgPath}/ca/ca.${ordererOrg.domain}-cert.pem`), true)
        assert.strictEqual(fs.existsSync(`${ordererOrgPath}/ca/priv_sk`), true)

        // tlsca
        assert.strictEqual(fs.existsSync(`${ordererOrgPath}/tlsca/tlsca.${ordererOrg.domain}-cert.pem`), true)
        assert.strictEqual(fs.existsSync(`${ordererOrgPath}/tlsca/priv_sk`), true)

        // yaml
        assert.strictEqual(fs.existsSync(`${ordererOrgPath}/users/Admin@${ordererOrg.domain}/msp/config.yaml`), true)

        // tls
        assert.strictEqual(fs.existsSync(`${ordererOrgPath}/users/Admin@${ordererOrg.domain}/tls/ca.crt`), true)
        assert.strictEqual(fs.existsSync(`${ordererOrgPath}/users/Admin@${ordererOrg.domain}/tls/client.crt`), true)
        assert.strictEqual(fs.existsSync(`${ordererOrgPath}/users/Admin@${ordererOrg.domain}/tls/client.key`), true)

        // orderers
        ordererOrg.hostname.forEach((hostname) => {
          const hostPath = `${ordererOrgPath}/orderers/${hostname}.${ordererOrg.domain}`

          // folder
          assert.strictEqual(fs.existsSync(hostPath), true)

          // msp
          assert.strictEqual(fs.existsSync(`${hostPath}/msp/config.yaml`), true)
          assert.strictEqual(fs.existsSync(`${hostPath}/msp/signcerts/${hostname}.${ordererOrg.domain}-cert.pem`), true)

          // tls
          assert.strictEqual(fs.existsSync(`${hostPath}/tls/ca.crt`), true)
          assert.strictEqual(fs.existsSync(`${hostPath}/tls/server.crt`), true)
          assert.strictEqual(fs.existsSync(`${hostPath}/tls/server.key`), true)
        })
      })
    })
  })

  describe('copyTLSCa', () => {
    before(async () => {
      minimumNetwork.createNetworkFolder()
      await ordererService.cryptogen({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'newest_genesis' })
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    it('should copy the orderer TLS CA to the specified folder under the blockchain network', () => {
      ordererService.copyTLSCa({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'newest_genesis' })

      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/tlsca`), true)

      orgOrdererCreateJson.forEach((ordererOrg) => {
        ordererOrg.hostname.forEach((hostname) => {
          assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/tlsca/${hostname}.${ordererOrg.domain}`), true)
        })
      })
    })
  })

  describe('createDockerCompose', () => {
    before(async () => {
      minimumNetwork.createNetworkFolder()
      await ordererService.cryptogen({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'newest_genesis' })
      ordererService.copyTLSCa({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'newest_genesis' })
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    it('should generate orderer/peer docker-compose file', () => {
      ordererService.createDockerCompose({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'newest_genesis' })
      const dockerCompsoePath = `${config.infraConfig.bdkPath}/${config.networkName}/docker-compose`
      const dockerEnvPath = `${config.infraConfig.bdkPath}/${config.networkName}/env`

      assert.strictEqual(fs.existsSync(`${dockerCompsoePath}`), true)
      assert.strictEqual(fs.existsSync(`${dockerEnvPath}`), true)

      orgOrdererCreateJson.forEach((ordererOrg) => {
        ordererOrg.hostname.forEach((hostname) => {
          assert.strictEqual(fs.existsSync(`${dockerCompsoePath}/docker-compose-orderer-${hostname}.${ordererOrg.domain}.yaml`), true)
          assert.strictEqual(fs.existsSync(`${dockerEnvPath}/orderer-${hostname}.${ordererOrg.domain}.env`), true)
        })
      })
    })

    // TODO throw new ParamsError('genesisFileName is required')
  })

  describe('addOrgToChannel', () => {
    it('should use addOrgToChannelSteps', async () => {
      const addOrgToChannelStepsFetchChannelConfigStub = sinon.stub().resolves()
      const addOrgToChannelStepsComputeUpdateConfigTxStub = sinon.stub().resolves()

      const addOrgToChannelStepsStub = sinon.stub(Orderer.prototype, 'addOrgToChannelSteps').callsFake(() => ({
        fetchChannelConfig: addOrgToChannelStepsFetchChannelConfigStub,
        computeUpdateConfigTx: addOrgToChannelStepsComputeUpdateConfigTxStub,
      }))

      await ordererServiceOrg0Orderer.addOrgToChannel({
        channelName: minimumNetwork.channelName,
        orgName: orgOrdererCreateJson[0].name,
        orderer: minimumNetwork.getOrderer().fullUrl,
      })

      assert.strictEqual(addOrgToChannelStepsFetchChannelConfigStub.called, true)
      assert.strictEqual(addOrgToChannelStepsComputeUpdateConfigTxStub.called, true)

      addOrgToChannelStepsStub.restore()
    })
  })

  describe('addOrgToChannelSteps', () => {
    let channelName: string
    let channelPath: string
    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      channelName = minimumNetwork.channelName
      channelPath = `${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}`
    })
    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('fetchChannelConfig', () => {
      it('should fetch channel config from blockchain', async () => {
        await ordererServiceOrg0Orderer.addOrgToChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgOrdererCreateJson[0].name,
          orderer: minimumNetwork.getOrderer().fullUrl,
        })

        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_fetch.pb`), true)
      })
    })

    describe('computeUpdateConfigTx', () => {
      before(async () => {
        await ordererService.cryptogen({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'new-genesis' })
        await ordererService.createOrdererOrgConfigtxJSON({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'new-genesis' })
        await ordererServiceOrg0Orderer.addOrgToChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgOrdererCreateJson[0].name,
          orderer: minimumNetwork.getOrderer().fullUrl,
        })
      })

      it('should compute config diff', async () => {
        await ordererServiceOrg0Orderer.addOrgToChannelSteps().computeUpdateConfigTx({
          channelName,
          orgName: orgOrdererCreateJson[0].name,
          orderer: minimumNetwork.getOrderer().fullUrl,
        })

        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_update_envelope.pb`), true)
      })
    })
  })

  describe('addConsenterToChannel', () => {
    it('should use addConsenterToChannelSteps', async () => {
      const addConsenterToChannelStepsFetchChannelConfigStub = sinon.stub().resolves()
      const addConsenterToChannelStepsComputeUpdateConfigTxStub = sinon.stub().resolves()

      const addConsenterToChannelStepsStub = sinon.stub(Orderer.prototype, 'addConsenterToChannelSteps').callsFake(() => ({
        fetchChannelConfig: addConsenterToChannelStepsFetchChannelConfigStub,
        computeUpdateConfigTx: addConsenterToChannelStepsComputeUpdateConfigTxStub,
      }))
      await ordererServiceOrg0Orderer.addConsenterToChannel({
        channelName: minimumNetwork.channelName,
        orgName: orgOrdererCreateJson[0].name,
        orderer: minimumNetwork.getOrderer().fullUrl,
        hostname: orgOrdererCreateJson[0].hostname[0],
      })

      assert.strictEqual(addConsenterToChannelStepsFetchChannelConfigStub.called, true)
      assert.strictEqual(addConsenterToChannelStepsComputeUpdateConfigTxStub.called, true)

      addConsenterToChannelStepsStub.restore()
    })
  })

  describe('addConsenterToChannelSteps', () => {
    let channelName: string
    let channelPath: string

    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      channelName = minimumNetwork.channelName
      channelPath = `${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}`
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('fetchChannelConfig', () => {
      it('should fetch channel config from blockchain', async () => {
        await ordererServiceOrg0Orderer.addConsenterToChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgOrdererCreateJson[0].name,
          orderer: minimumNetwork.getOrderer().fullUrl,
          hostname: orgOrdererCreateJson[0].hostname[0],
        })

        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_fetch.pb`), true)
      })
    })

    describe('computeUpdateConfigTx', () => {
      before(async () => {
        await ordererService.cryptogen({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'new-genesis' })
        await ordererService.createOrdererOrgConfigtxJSON({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'new-genesis' })
        await ordererServiceOrg0Orderer.addConsenterToChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgOrdererCreateJson[0].name,
          orderer: minimumNetwork.getOrderer().fullUrl,
          hostname: orgOrdererCreateJson[0].hostname[0],
        })
      })

      it('should compute config diff', async () => {
        await ordererServiceOrg0Orderer.addConsenterToChannelSteps().computeUpdateConfigTx({
          channelName,
          orgName: orgOrdererCreateJson[0].name,
          orderer: minimumNetwork.getOrderer().fullUrl,
          hostname: orgOrdererCreateJson[0].hostname[0],
        })
        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_update_envelope.pb`), true)
      })
    })
  })
})
