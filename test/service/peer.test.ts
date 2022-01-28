/* global describe, it, before, after, beforeEach, afterEach */
import fs from 'fs'
import assert from 'assert'
import net from 'net'
import Network from '../../src/service/network'
import config, { Config as bdkConfig } from '../../src/config'
import Config from '../../src/service/config'
import Peer from '../../src/service/peer'
import { NetworkCreateType, NetworkCreatePeerOrgType } from '../../src/model/type/network.type'
import Orderer from '../../src/service/orderer'
import Channel from '../../src/service/channel'
import { PolicyTypeEnum } from '../../src/model/type/channel.type'
import { OrgTypeEnum } from '../../src/model/type/config.type'

describe('Peer service:', function () {
  this.timeout(60000)

  let networkService: Network
  let networkCreateJson: NetworkCreateType
  let orgPeerCreateJson: NetworkCreatePeerOrgType[]
  let peerService: Peer
  let ordererService: Orderer
  let channelServiceOrg0: Channel
  let peerServiceOrg0: Peer
  let peerServiceOrg0Orderer: Peer

  before(() => {
    networkService = new Network(config)
    peerService = new Peer(config)
    ordererService = new Orderer(config)
    networkCreateJson = JSON.parse(fs.readFileSync('./cicd/test_script/network-create-min.json').toString())
    orgPeerCreateJson = JSON.parse(fs.readFileSync('./cicd/test_script/org-peer-create.json').toString())
    const org0PeerConfig: bdkConfig = {
      ...config,
      orgType: OrgTypeEnum.PEER,
      orgName: networkCreateJson.peerOrgs[0].name,
      orgDomainName: networkCreateJson.peerOrgs[0].domain,
      hostname: 'peer0',
    }
    channelServiceOrg0 = new Channel(org0PeerConfig)
    peerServiceOrg0 = new Peer(org0PeerConfig)
    const org0OrdererConfig: bdkConfig = {
      ...config,
      orgType: OrgTypeEnum.ORDERER,
      orgName: networkCreateJson.ordererOrgs[0].name,
      orgDomainName: networkCreateJson.ordererOrgs[0].domain,
      hostname: networkCreateJson.ordererOrgs[0].hostname[0],
    }
    peerServiceOrg0Orderer = new Peer(org0OrdererConfig)
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
      const peerHostname = `peer0.${networkCreateJson.peerOrgs[0].domain}`
      const port = networkCreateJson.peerOrgs[0].ports ? networkCreateJson.peerOrgs[0].ports[0].port : 7051

      peerService.up({ peerHostname }).then(() => {
        const socket = net.connect(port, '127.0.0.1', () => {
          peerService.down({ peerHostname })
            .then(() => {
              // TODO check container
              done()
            })
            .catch((err) => {
              assert.fail(`peer down error: ${err.message}`)
            })
        })

        socket.on('error', (err) => {
          assert.fail(`peer connect test error: ${err.message}`)
        })
      }).catch((err) => {
        assert.fail(`peer up error: ${err.message}`)
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

    it('should generate peer ca file when function cryptogen done', async () => {
      await peerService.cryptogen({ peerOrgs: orgPeerCreateJson })

      /**
       * config-yaml
       */
      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/config-yaml/crypto-config.yaml`), true)

      /**
       * peerOrganizations
       */
      orgPeerCreateJson.forEach((peerOrg) => {
        const peerOrgPath = `${config.infraConfig.bdkPath}/${config.networkName}/peerOrganizations/${peerOrg.domain}`

        // folder
        assert.strictEqual(fs.existsSync(`${peerOrgPath}`), true)

        // ca
        assert.strictEqual(fs.existsSync(`${peerOrgPath}/ca/ca.${peerOrg.domain}-cert.pem`), true)
        assert.strictEqual(fs.existsSync(`${peerOrgPath}/ca/priv_sk`), true)

        // tlsca
        assert.strictEqual(fs.existsSync(`${peerOrgPath}/tlsca/tlsca.${peerOrg.domain}-cert.pem`), true)
        assert.strictEqual(fs.existsSync(`${peerOrgPath}/tlsca/priv_sk`), true)

        // yaml
        assert.strictEqual(fs.existsSync(`${peerOrgPath}/users/Admin@${peerOrg.domain}/msp/config.yaml`), true)

        // tls
        assert.strictEqual(fs.existsSync(`${peerOrgPath}/users/Admin@${peerOrg.domain}/tls/ca.crt`), true)
        assert.strictEqual(fs.existsSync(`${peerOrgPath}/users/Admin@${peerOrg.domain}/tls/client.crt`), true)
        assert.strictEqual(fs.existsSync(`${peerOrgPath}/users/Admin@${peerOrg.domain}/tls/client.key`), true)

        // peers peerCount
        for (let index = 0; index < peerOrg.peerCount; index++) {
          const hostname = `peer${index}`
          const hostPath = `${peerOrgPath}/peers/${hostname}.${peerOrg.domain}`

          // folder
          assert.strictEqual(fs.existsSync(hostPath), true)

          // msp
          assert.strictEqual(fs.existsSync(`${hostPath}/msp/config.yaml`), true)
          assert.strictEqual(fs.existsSync(`${hostPath}/msp/signcerts/${hostname}.${peerOrg.domain}-cert.pem`), true)

          // tls
          assert.strictEqual(fs.existsSync(`${hostPath}/tls/ca.crt`), true)
          assert.strictEqual(fs.existsSync(`${hostPath}/tls/server.crt`), true)
          assert.strictEqual(fs.existsSync(`${hostPath}/tls/server.key`), true)
        }
      })
    })
  })

  describe('copyTLSCa', () => {
    before(async () => {
      (new Config(config)).init()
      networkService.createNetworkFolder()
      await peerService.cryptogen({ peerOrgs: orgPeerCreateJson })
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('should copy the peer TLS CA to the specified folder under the blockchain network', () => {
      peerService.copyTLSCa({ peerOrgs: orgPeerCreateJson })

      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/tlsca`), true)

      orgPeerCreateJson.forEach((peerOrg) => {
        for (let index = 0; index < peerOrg.peerCount; index++) {
          assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/tlsca/peer${index}.${peerOrg.domain}`), true)
        }
      })
    })
  })

  describe('createConnectionProfileYaml', () => {
    before(async () => {
      (new Config(config)).init()
      networkService.createNetworkFolder()
      await peerService.cryptogen({ peerOrgs: orgPeerCreateJson })
      peerService.copyTLSCa({ peerOrgs: orgPeerCreateJson })
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('should generate peer connection profile file', () => {
      peerService.createConnectionProfileYaml({ peerOrgs: orgPeerCreateJson })

      orgPeerCreateJson.forEach((peerOrg) => {
        const filePath = `${config.infraConfig.bdkPath}/${config.networkName}/peerOrganizations/${peerOrg.domain}`
        assert.strictEqual(fs.existsSync(`${filePath}/connection-${peerOrg.name}.json`), true)
        assert.strictEqual(fs.existsSync(`${filePath}/connection-${peerOrg.name}.yaml`), true)
      })
    })

    it.skip('should throw error when peerOrgs is undefined', () => {
      // TODO
    })
  })

  // TODO createPeerOrgConfigtxJSON

  describe('createDockerCompose', () => {
    before(async () => {
      (new Config(config)).init()
      networkService.createNetworkFolder()
      await peerService.cryptogen({ peerOrgs: orgPeerCreateJson })
      peerService.copyTLSCa({ peerOrgs: orgPeerCreateJson })
      peerService.createConnectionProfileYaml({ peerOrgs: orgPeerCreateJson })
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('should generate orderer/peer docker-compose file', () => {
      peerService.createDockerCompose({ peerOrgs: orgPeerCreateJson })
      const dockerCompsoePath = `${config.infraConfig.bdkPath}/${config.networkName}/docker-compose`
      const dockerEnvPath = `${config.infraConfig.bdkPath}/${config.networkName}/env`

      assert.strictEqual(fs.existsSync(`${dockerCompsoePath}`), true)
      assert.strictEqual(fs.existsSync(`${dockerEnvPath}`), true)

      orgPeerCreateJson.forEach((peerOrg) => {
        for (let index = 0; index < peerOrg.peerCount; index++) {
          assert.strictEqual(fs.existsSync(`${dockerCompsoePath}/docker-compose-peer-peer${index}.${peerOrg.domain}.yaml`), true)
          assert.strictEqual(fs.existsSync(`${dockerEnvPath}/peer-peer${index}.${peerOrg.domain}.env`), true)
        }
      })
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
        await peerServiceOrg0.addOrgToChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgPeerCreateJson[0].name,
        })
        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_fetch.pb`), true)
      })
    })
    describe('computeUpdateConfigTx', () => {
      before(async () => {
        await peerService.cryptogen({ peerOrgs: orgPeerCreateJson })
        await peerService.createPeerOrgConfigtxJSON({ peerOrgs: orgPeerCreateJson })
        await peerServiceOrg0.addOrgToChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgPeerCreateJson[0].name,
        })
      })
      it('should compute config diff', async () => {
        await peerServiceOrg0.addOrgToChannelSteps().computeUpdateConfigTx({
          channelName,
          orgName: orgPeerCreateJson[0].name,
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

  describe('addOrgToSystemChannelSteps', () => {
    const channelName = 'system-channel'
    const channelPath = `${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}`
    before(async () => {
      networkService.createNetworkFolder()
      await networkService.cryptogen(networkCreateJson)
      networkService.copyTLSCa(networkCreateJson)
      await networkService.createGenesisBlock(networkCreateJson)
      networkService.createDockerCompose(networkCreateJson)
      await peerService.up({ peerHostname: `peer0.${networkCreateJson.peerOrgs[0].domain}` })
      await ordererService.up({ ordererHostname: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}` })
      await new Promise(resolve => setTimeout(resolve, 1000))
    })
    describe('fetchChannelConfig', () => {
      it('should fetch channel config from blockchain', async () => {
        await peerServiceOrg0Orderer.addOrgToSystemChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgPeerCreateJson[0].name,
          orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
        })
        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_fetch.pb`), true)
      })
    })
    describe('computeUpdateConfigTx', () => {
      before(async () => {
        await peerService.cryptogen({ peerOrgs: orgPeerCreateJson })
        await peerService.createPeerOrgConfigtxJSON({ peerOrgs: orgPeerCreateJson })
        await peerServiceOrg0Orderer.addOrgToSystemChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgPeerCreateJson[0].name,
          orderer: `${networkCreateJson.ordererOrgs[0].hostname[0]}.${networkCreateJson.ordererOrgs[0].domain}:${networkCreateJson.ordererOrgs[0]?.ports?.[0].port}`,
        })
      })
      it('should compute config diff', async () => {
        await peerServiceOrg0Orderer.addOrgToSystemChannelSteps().computeUpdateConfigTx({
          channelName,
          orgName: orgPeerCreateJson[0].name,
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

  // TODO getPeerAddressList
})
