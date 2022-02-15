/* global describe, it, before, after */
import fs from 'fs'
import assert from 'assert'
import net from 'net'
import sinon from 'sinon'
import config from '../../src/config'
import Peer from '../../src/service/peer'
import { NetworkCreatePeerOrgType } from '../../src/model/type/network.type'
import MinimumNetwork from '../util/minimumNetwork'

describe('Peer service:', function () {
  this.timeout(60000)

  let minimumNetwork: MinimumNetwork
  let orgPeerCreateJson: NetworkCreatePeerOrgType[]
  let peerService: Peer
  let peerServiceOrg0Peer: Peer
  let peerServiceOrg0Orderer: Peer

  before(() => {
    minimumNetwork = new MinimumNetwork()
    peerService = new Peer(config)
    peerServiceOrg0Peer = new Peer(minimumNetwork.org0PeerConfig)
    peerServiceOrg0Orderer = new Peer(minimumNetwork.org0OrdererConfig)
    orgPeerCreateJson = JSON.parse(fs.readFileSync('./cicd/test_script/org-peer-create.json').toString())
  })

  describe('up & down', () => {
    before(async () => {
      await minimumNetwork.createNetwork()
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    it('should start and shutdown docker container', (done) => {
      const peerHostname = `${minimumNetwork.getPeer().hostname}.${minimumNetwork.getPeer().orgDomain}`
      const port = minimumNetwork.getPeer().port

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
      minimumNetwork.createNetworkFolder()
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
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
      minimumNetwork.createNetworkFolder()
      await peerService.cryptogen({ peerOrgs: orgPeerCreateJson })
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
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
      minimumNetwork.createNetworkFolder()
      await peerService.cryptogen({ peerOrgs: orgPeerCreateJson })
      peerService.copyTLSCa({ peerOrgs: orgPeerCreateJson })
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
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
      minimumNetwork.createNetworkFolder()
      await peerService.cryptogen({ peerOrgs: orgPeerCreateJson })
      peerService.copyTLSCa({ peerOrgs: orgPeerCreateJson })
      peerService.createConnectionProfileYaml({ peerOrgs: orgPeerCreateJson })
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
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

  describe('addOrgToChannel', () => {
    it('should use addOrgToChannelSteps', async () => {
      const addOrgToChannelStepsFetchChannelConfigStub = sinon.stub().resolves()
      const addOrgToChannelStepsComputeUpdateConfigTxStub = sinon.stub().resolves()

      const addOrgToChannelStepsStub = sinon.stub(Peer.prototype, 'addOrgToChannelSteps').callsFake(() => ({
        fetchChannelConfig: addOrgToChannelStepsFetchChannelConfigStub,
        computeUpdateConfigTx: addOrgToChannelStepsComputeUpdateConfigTxStub,
      }))
      await peerService.addOrgToChannel({
        channelName: minimumNetwork.channelName,
        orgName: orgPeerCreateJson[0].name,
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
      channelName = minimumNetwork.channelName
      channelPath = `${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}`
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('fetchChannelConfig', () => {
      it('should fetch channel config from blockchain', async () => {
        await peerServiceOrg0Peer.addOrgToChannelSteps().fetchChannelConfig({
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
        await peerServiceOrg0Peer.addOrgToChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgPeerCreateJson[0].name,
        })
      })
      it('should compute config diff', async () => {
        await peerServiceOrg0Peer.addOrgToChannelSteps().computeUpdateConfigTx({
          channelName,
          orgName: orgPeerCreateJson[0].name,
        })
        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_update_envelope.pb`), true)
      })
    })
  })

  describe('addOrgToSystemChannel', () => {
    it('should use addOrgToSystemChannelSteps', async () => {
      const addOrgToSystemChannelStepsFetchChannelConfigStub = sinon.stub().resolves()
      const addOrgToSystemChannelStepsComputeUpdateConfigTxStub = sinon.stub().resolves()

      const addOrgToSystemChannelStepsStub = sinon.stub(Peer.prototype, 'addOrgToSystemChannelSteps').callsFake(() => ({
        fetchChannelConfig: addOrgToSystemChannelStepsFetchChannelConfigStub,
        computeUpdateConfigTx: addOrgToSystemChannelStepsComputeUpdateConfigTxStub,
      }))

      await peerService.addOrgToSystemChannel({
        channelName: minimumNetwork.channelName,
        orgName: orgPeerCreateJson[0].name,
        orderer: minimumNetwork.getOrderer().fullUrl,
      })
      assert.strictEqual(addOrgToSystemChannelStepsFetchChannelConfigStub.called, true)
      assert.strictEqual(addOrgToSystemChannelStepsComputeUpdateConfigTxStub.called, true)
      addOrgToSystemChannelStepsStub.restore()
    })
  })

  describe('addOrgToSystemChannelSteps', () => {
    let channelName: string
    let channelPath: string
    before(async () => {
      channelName = 'system-channel'
      channelPath = `${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}`
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('fetchChannelConfig', () => {
      it('should fetch channel config from blockchain', async () => {
        await peerServiceOrg0Orderer.addOrgToSystemChannelSteps().fetchChannelConfig({
          channelName,
          orgName: orgPeerCreateJson[0].name,
          orderer: minimumNetwork.getOrderer().fullUrl,
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
          orderer: minimumNetwork.getOrderer().fullUrl,
        })
      })
      it('should compute config diff', async () => {
        await peerServiceOrg0Orderer.addOrgToSystemChannelSteps().computeUpdateConfigTx({
          channelName,
          orgName: orgPeerCreateJson[0].name,
          orderer: minimumNetwork.getOrderer().fullUrl,
        })
        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_update_envelope.pb`), true)
      })
    })
  })
})
