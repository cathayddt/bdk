/* global describe, it, before, after */
import fs from 'fs'
import assert from 'assert'
import net from 'net'
import Network from '../../src/service/network'
import config from '../../src/config'
import Config from '../../src/service/config'
import Orderer from '../../src/service/orderer'
import { NetworkCreateType, NetworkCreateOrdererOrgType } from '../../src/model/type/network.type'

describe('Orderer service:', function () {
  this.timeout(10000)

  let networkService: Network
  let networkCreateJson: NetworkCreateType
  let orgOrdererCreateJson: NetworkCreateOrdererOrgType[]
  let ordererService: Orderer

  before(() => {
    networkService = new Network(config)
    ordererService = new Orderer(config)
    networkCreateJson = JSON.parse(fs.readFileSync('./cicd/test_script/network-create.json').toString())
    orgOrdererCreateJson = JSON.parse(fs.readFileSync('./cicd/test_script/org-orderer-create.json').toString())
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

  // TODO createOrdererOrgConfigtxJSON
  // TODO addOrgToChannel
  // TODO addOrgToChannelSteps
  // TODO addConsenterToChannel
  // TODO addConsenterToChannelSteps
})
