/* global describe, it, before, beforeEach, after */
import fs from 'fs'
import assert from 'assert'
import Network from '../../src/service/network'
import config from '../../src/config'
import Config from '../../src/service/config'
import { NetworkCreateType } from '../../src/model/type/network.type'

describe('Network service:', function () {
  this.timeout(10000)

  let networkService: Network
  let networkCreateJson: NetworkCreateType

  before(() => {
    networkCreateJson = JSON.parse(fs.readFileSync('./cicd/test_script/network-create.json').toString())
  })

  describe('createNetworkFolder', () => {
    before(() => {
      (new Config(config)).init()
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('should exist network folder in specified path', () => {
      networkService = new Network(config)

      networkService.createNetworkFolder()

      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}`), true)
    })
  })

  describe('cryptogen', () => {
    before(() => {
      (new Config(config)).init()
      networkService = new Network(config)
      networkService.createNetworkFolder()
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('should generate ca file when function cryptogen done', async () => {
      await networkService.cryptogen(networkCreateJson)

      /**
       * config-yaml
       */
      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/config-yaml/crypto-config.yaml`), true)

      /**
       * ordererOrganizations
       */
      networkCreateJson.ordererOrgs.forEach((ordererOrg) => {
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

      /**
       * peerOrganizations
       */
      networkCreateJson.peerOrgs.forEach((peerOrg) => {
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
      networkService = new Network(config)
      networkService.createNetworkFolder()
      await networkService.cryptogen(networkCreateJson)
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('should copy the TLS CA to the specified folder under the blockchain network', () => {
      networkService.copyTLSCa(networkCreateJson)

      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/tlsca`), true)

      networkCreateJson.ordererOrgs.forEach((ordererOrg) => {
        ordererOrg.hostname.forEach((hostname) => {
          assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/tlsca/${hostname}.${ordererOrg.domain}`), true)
        })
      })

      networkCreateJson.peerOrgs.forEach((peerOrg) => {
        for (let index = 0; index < peerOrg.peerCount; index++) {
          assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/tlsca/peer${index}.${peerOrg.domain}`), true)
        }
      })
    })
  })

  describe('createGenesisBlock', () => {
    before(async () => {
      (new Config(config)).init()
      networkService = new Network(config)
      networkService.createNetworkFolder()
      await networkService.cryptogen(networkCreateJson)
      networkService.copyTLSCa(networkCreateJson)
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('should generate genesis.block file and org-json file', async () => {
      await networkService.createGenesisBlock(networkCreateJson)

      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/system-channel/genesis.block`), true)
      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/config-yaml/configtx.yaml`), true)

      networkCreateJson.ordererOrgs.forEach((ordererOrg) => {
        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/config-yaml/orgs/orderer-${ordererOrg.name}.json`), true)
        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/org-json/${ordererOrg.name}-consenter.json`), true)
        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/org-json/${ordererOrg.name}.json`), true)
      })

      networkCreateJson.peerOrgs.forEach((peerOrg) => {
        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/config-yaml/orgs/peer-${peerOrg.name}.json`), true)
        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/org-json/${peerOrg.name}.json`), true)
      })
    })
  })

  describe('createConnectionProfile', () => {
    before(async () => {
      (new Config(config)).init()
      networkService = new Network(config)
      networkService.createNetworkFolder()
      await networkService.cryptogen(networkCreateJson)
      networkService.copyTLSCa(networkCreateJson)
      await networkService.createGenesisBlock(networkCreateJson)
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('should generate peer connection profile file', () => {
      networkService.createConnectionProfile(networkCreateJson)

      networkCreateJson.peerOrgs.forEach((peerOrg) => {
        const filePath = `${config.infraConfig.bdkPath}/${config.networkName}/peerOrganizations/${peerOrg.domain}`
        assert.strictEqual(fs.existsSync(`${filePath}/connection-${peerOrg.name}.json`), true)
        assert.strictEqual(fs.existsSync(`${filePath}/connection-${peerOrg.name}.yaml`), true)
      })
    })

    it.skip('should throw error when peerOrgs is undefined', () => {
      // TODO
    })
  })

  describe('createDockerCompose', () => {
    before(async () => {
      (new Config(config)).init()
      networkService = new Network(config)
      networkService.createNetworkFolder()
      await networkService.cryptogen(networkCreateJson)
      networkService.copyTLSCa(networkCreateJson)
      await networkService.createGenesisBlock(networkCreateJson)
      networkService.createConnectionProfile(networkCreateJson)
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('should generate orderer/peer docker-compose file', () => {
      networkService.createDockerCompose(networkCreateJson)
      const dockerCompsoePath = `${config.infraConfig.bdkPath}/${config.networkName}/docker-compose`
      const dockerEnvPath = `${config.infraConfig.bdkPath}/${config.networkName}/env`

      assert.strictEqual(fs.existsSync(`${dockerCompsoePath}`), true)
      assert.strictEqual(fs.existsSync(`${dockerEnvPath}`), true)

      networkCreateJson.ordererOrgs.forEach((ordererOrg) => {
        ordererOrg.hostname.forEach((hostname) => {
          assert.strictEqual(fs.existsSync(`${dockerCompsoePath}/docker-compose-orderer-${hostname}.${ordererOrg.domain}.yaml`), true)
          assert.strictEqual(fs.existsSync(`${dockerEnvPath}/orderer-${hostname}.${ordererOrg.domain}.env`), true)
        })
      })

      networkCreateJson.peerOrgs.forEach((peerOrg) => {
        for (let index = 0; index < peerOrg.peerCount; index++) {
          assert.strictEqual(fs.existsSync(`${dockerCompsoePath}/docker-compose-peer-peer${index}.${peerOrg.domain}.yaml`), true)
          assert.strictEqual(fs.existsSync(`${dockerEnvPath}/peer-peer${index}.${peerOrg.domain}.env`), true)
        }
      })
    })
  })

  describe('delete', () => {
    beforeEach(() => {
      (new Config(config)).init()
      networkService = new Network(config)
      networkService.createNetworkFolder()
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true, force: true })
    })

    it.skip('should shutdown docker container', async () => {
      await networkService.cryptogen(networkCreateJson)
      networkService.copyTLSCa(networkCreateJson)
      await networkService.createGenesisBlock(networkCreateJson)
      networkService.createConnectionProfile(networkCreateJson)
      networkService.createDockerCompose(networkCreateJson)

      // TODO start container

      await networkService.delete(config.networkName)

      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}`), false)
    })

    it('should delete network folder in specified path', async () => {
      await networkService.delete(config.networkName)

      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}`), false)
    })
  })
})
