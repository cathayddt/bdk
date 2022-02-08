/* global describe, it, before, after */
import fs from 'fs'
import assert from 'assert'
import net from 'net'
import sinon from 'sinon'
import Network from '../../src/service/network'
import config, { Config as bdkConfig } from '../../src/config'
import Config from '../../src/service/config'
import Orderer from '../../src/service/orderer'
import { NetworkCreateType, NetworkCreateOrdererOrgType } from '../../src/model/type/network.type'
import { OrgTypeEnum } from '../../src/model/type/config.type'
import Peer from '../../src/service/peer'
import Channel from '../../src/service/channel'
import { PolicyTypeEnum } from '../../src/model/type/channel.type'

describe('Orderer service:', function () {
  this.timeout(60000)

  let networkService: Network
  let networkCreateJson: NetworkCreateType
  let orgOrdererCreateJson: NetworkCreateOrdererOrgType[]
  let ordererService: Orderer
  let ordererServiceOrg0Orderer: Orderer
  let peerService: Peer
  let channelServiceOrg0: Channel

  before(() => {
    networkService = new Network(config)
    ordererService = new Orderer(config)
    networkCreateJson = JSON.parse(fs.readFileSync('./cicd/test_script/network-create-min.json').toString())
    orgOrdererCreateJson = JSON.parse(fs.readFileSync('./cicd/test_script/org-orderer-create.json').toString())
    const org0OrdererConfig: bdkConfig = {
      ...config,
      orgType: OrgTypeEnum.ORDERER,
      orgName: networkCreateJson.ordererOrgs[0].name,
      orgDomainName: networkCreateJson.ordererOrgs[0].domain,
      hostname: networkCreateJson.ordererOrgs[0].hostname[0],
    }
    ordererServiceOrg0Orderer = new Orderer(org0OrdererConfig)
    peerService = new Peer(config)
    const org0PeerConfig: bdkConfig = {
      ...config,
      orgType: OrgTypeEnum.PEER,
      orgName: networkCreateJson.peerOrgs[0].name,
      orgDomainName: networkCreateJson.peerOrgs[0].domain,
      hostname: 'peer0',
    }
    channelServiceOrg0 = new Channel(org0PeerConfig)
  })

  describe('up & down', () => {
    before(async () => {
      (new Config(config)).init()
      networkService.createNetworkFolder()
      await networkService.cryptogen(networkCreateJson)
      await networkService.createGenesisBlock(networkCreateJson)
      networkService.createDockerCompose(networkCreateJson)
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('should start and shutdown docker container', (done) => {
      const ordererHostname = `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}`
      const port = networkCreateJson.ordererOrgs[0].ports ? networkCreateJson.ordererOrgs[0].ports[0].port : 7050

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
      (new Config(config)).init()
      networkService.createNetworkFolder()
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
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
      (new Config(config)).init()
      networkService.createNetworkFolder()
      await ordererService.cryptogen({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'newest_genesis' })
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
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

  // TODO createOrdererOrgConfigtxJSON

  describe('createDockerCompose', () => {
    before(async () => {
      (new Config(config)).init()
      networkService.createNetworkFolder()
      await ordererService.cryptogen({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'newest_genesis' })
      ordererService.copyTLSCa({ ordererOrgs: orgOrdererCreateJson, genesisFileName: 'newest_genesis' })
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
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
    const channelName = 'test-channel'
    it('should use addOrgToChannelSteps', async () => {
      const addOrgToChannelStepsFetchChannelConfigStub = sinon.stub().resolves()
      const addOrgToChannelStepsComputeUpdateConfigTxStub = sinon.stub().resolves()

      const addOrgToChannelStepsStub = sinon.stub(Orderer.prototype, 'addOrgToChannelSteps').callsFake(() => ({
        fetchChannelConfig: addOrgToChannelStepsFetchChannelConfigStub,
        computeUpdateConfigTx: addOrgToChannelStepsComputeUpdateConfigTxStub,
      }))
      await ordererServiceOrg0Orderer.addOrgToChannel({
        channelName,
        orgName: orgOrdererCreateJson[0].name,
        orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
      })
      assert.strictEqual(addOrgToChannelStepsFetchChannelConfigStub.called, true)
      assert.strictEqual(addOrgToChannelStepsComputeUpdateConfigTxStub.called, true)
      addOrgToChannelStepsStub.restore()
    })
  })

  describe('addOrgToChannelSteps', () => {
    const channelName = 'test-channel'
    const channelPath = `${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}`
    before(async () => {
      networkService.createNetworkFolder()
      await networkService.cryptogen(networkCreateJson)
      networkService.copyTLSCa(networkCreateJson)
      await networkService.createGenesisBlock(networkCreateJson)
      networkService.createDockerCompose(networkCreateJson)
      await peerService.up({ peerHostname: `peer0.${networkCreateJson.peerOrgs[0].domain}` })
      await ordererService.up({ ordererHostname: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}` })
      await channelServiceOrg0.create({
        channelName,
        orgNames: [networkCreateJson.peerOrgs[0].name],
        channelAdminPolicy: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Admins' },
        lifecycleEndorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
        endorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
        orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
      })
      await channelServiceOrg0.join({
        channelName,
        orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
      })
    })
    describe('fetchChannelConfig', () => {
      it('should fetch channel config from blockchain', async () => {
        await ordererServiceOrg0Orderer.addOrgToChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgOrdererCreateJson[0].name,
          orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
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
          orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
        })
      })
      it('should compute config diff', async () => {
        await ordererServiceOrg0Orderer.addOrgToChannelSteps().computeUpdateConfigTx({
          channelName,
          orgName: orgOrdererCreateJson[0].name,
          orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
        })
        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_update_envelope.pb`), true)
      })
    })
    after(async () => {
      await peerService.down({ peerHostname: `peer0.${networkCreateJson.peerOrgs[0].domain}` })
      await ordererService.down({ ordererHostname: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}` })
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })
  })

  describe('addConsenterToChannel', () => {
    const channelName = 'test-channel'
    it('should use addConsenterToChannel', async () => {
      const addConsenterToChannelStepsFetchChannelConfigStub = sinon.stub().resolves()
      const addConsenterToChannelStepsComputeUpdateConfigTxStub = sinon.stub().resolves()

      const addConsenterToChannelStepsStub = sinon.stub(Orderer.prototype, 'addConsenterToChannelSteps').callsFake(() => ({
        fetchChannelConfig: addConsenterToChannelStepsFetchChannelConfigStub,
        computeUpdateConfigTx: addConsenterToChannelStepsComputeUpdateConfigTxStub,
      }))
      await ordererServiceOrg0Orderer.addConsenterToChannel({
        channelName,
        orgName: orgOrdererCreateJson[0].name,
        orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
        hostname: orgOrdererCreateJson[0].hostname[0],
      })
      assert.strictEqual(addConsenterToChannelStepsFetchChannelConfigStub.called, true)
      assert.strictEqual(addConsenterToChannelStepsComputeUpdateConfigTxStub.called, true)
      addConsenterToChannelStepsStub.restore()
    })
  })

  describe('addConsenterToChannelSteps', () => {
    const channelName = 'test-channel'
    const channelPath = `${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}`
    before(async () => {
      networkService.createNetworkFolder()
      await networkService.cryptogen(networkCreateJson)
      networkService.copyTLSCa(networkCreateJson)
      await networkService.createGenesisBlock(networkCreateJson)
      networkService.createDockerCompose(networkCreateJson)
      await peerService.up({ peerHostname: `peer0.${networkCreateJson.peerOrgs[0].domain}` })
      await ordererService.up({ ordererHostname: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}` })
      await channelServiceOrg0.create({
        channelName,
        orgNames: [networkCreateJson.peerOrgs[0].name],
        channelAdminPolicy: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Admins' },
        lifecycleEndorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
        endorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
        orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
      })
      await channelServiceOrg0.join({
        channelName,
        orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
      })
    })
    describe('fetchChannelConfig', () => {
      it('should fetch channel config from blockchain', async () => {
        await ordererServiceOrg0Orderer.addConsenterToChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgOrdererCreateJson[0].name,
          orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
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
          orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
          hostname: orgOrdererCreateJson[0].hostname[0],
        })
      })
      it('should compute config diff', async () => {
        await ordererServiceOrg0Orderer.addConsenterToChannelSteps().computeUpdateConfigTx({
          channelName,
          orgName: orgOrdererCreateJson[0].name,
          orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
          hostname: orgOrdererCreateJson[0].hostname[0],
        })
        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_update_envelope.pb`), true)
      })
    })
    after(async () => {
      await peerService.down({ peerHostname: `peer0.${networkCreateJson.peerOrgs[0].domain}` })
      await ordererService.down({ ordererHostname: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}` })
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })
  })
})
