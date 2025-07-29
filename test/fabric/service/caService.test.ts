/* global describe, it, before, after */
import fs from 'fs'
import assert from 'assert'
import net from 'net'
import Ca from '../../../src/fabric/service/caService'
import config from '../../../src/fabric/config'
import { CaEnrollCommandTypeEnum, CaRegisterTypeEnum } from '../../../src/fabric/model/type/caService.type'
import { sleep } from '../../../src/util'

describe('Fabric.CA', function () {
  this.timeout(10000)

  let caService: Ca

  const rcaArgv = {
    basic: {
      caName: 'rca.cathaybc.com',
      port: 7054,
      adminUser: 'admin',
      adminPass: 'adminpw',
    },
    crypto: { tlsCertFile: '', tlsKeyFile: '', caCertFile: '', caKeyFile: '' },
    signing: {
      defaultExpiry: '8760h',
      profilesCaExpiry: '43800h',
      profilesTlsExpiry: '8760h',
    },
    csr: {
      cn: 'rca.cathaybc.com',
      hosts: 'rca.cathaybc.com',
      expiry: '87600h',
      pathlength: 1,
    },
    intermediate: {
      parentserverUrl: 'https://<id>:<secret>@hostname',
      parentserverCn: '',
      enrollmentHost: '',
    },
    upstreamEnabled: false,
  }

  const icaArgv = {
    basic: {
      caName: 'ica.org0.cathaybc.com',
      port: 7154,
      adminUser: 'admin',
      adminPass: 'adminpw',
    },
    crypto: { tlsCertFile: '', tlsKeyFile: '', caCertFile: '', caKeyFile: '' },
    signing: {
      defaultExpiry: '8760h',
      profilesCaExpiry: '43800h',
      profilesTlsExpiry: '8760h',
    },
    csr: { cn: '', hosts: '', expiry: '131400h', pathlength: 0 },
    intermediate: {
      parentserverUrl: 'https://ica.org0.cathaybc.com:org0icapw@rca.cathaybc.com:7054',
      parentserverCn: 'rca.cathaybc.com',
      enrollmentHost: 'ica.org0.cathaybc.com',
    },
    upstreamEnabled: true,
  }

  const enrollRcaClientArgv = {
    upstream: 'rca.cathaybc.com',
    upstreamPort: 7054,
    clientId: 'admin',
    clientSecret: 'adminpw',
    type: CaEnrollCommandTypeEnum.client,
    role: 'rca',
    orgHostname: 'rca.cathaybc.com',
  }

  const enrollOrdererClientArgv = {
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
    clientId: 'admin',
    clientSecret: 'adminpw',
    type: CaEnrollCommandTypeEnum.client,
    role: 'orderer',
    orgHostname: 'org0orderer.bdk.example.com',
  }

  const enrollOrdererOrgArgv = {
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
    clientId: 'Admin@org0orderer.bdk.example.com',
    clientSecret: 'adminpw',
    type: CaEnrollCommandTypeEnum.user,
    role: 'orderer',
    orgHostname: 'org0orderer.bdk.example.com',
  }

  const enrollOrderer0Argv = {
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
    clientId: 'orderer0.org0orderer.bdk.example.com',
    clientSecret: 'org0ordererpw',
    type: CaEnrollCommandTypeEnum.orderer,
    role: 'orderer',
    orgHostname: 'org0orderer.bdk.example.com',
  }

  const enrollPeerClientArgv = {
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
    clientId: 'admin',
    clientSecret: 'adminpw',
    type: CaEnrollCommandTypeEnum.client,
    role: 'peer',
    orgHostname: 'org0.bdk.example.com',
  }

  const enrollPeerOrgArgv = {
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
    clientId: 'Admin@org0.bdk.example.com',
    clientSecret: 'adminpw',
    type: CaEnrollCommandTypeEnum.user,
    role: 'peer',
    orgHostname: 'org0.bdk.example.com',
  }

  const enrollPeer0Argv = {
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
    clientId: 'peer0.org0.bdk.example.com',
    clientSecret: 'org0peerpw',
    type: CaEnrollCommandTypeEnum.peer,
    role: 'peer',
    orgHostname: 'org0.bdk.example.com',
  }

  const registerIcaArgv = {
    upstream: 'rca.cathaybc.com',
    upstreamPort: 7054,
    clientId: 'ica.org0.cathaybc.com',
    clientSecret: 'org0icapw',
    type: CaRegisterTypeEnum.ica,
    admin: 'admin',
  }

  const registerOrdererOrgArgv = {
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
    clientId: 'Admin@org0orderer.bdk.example.com',
    clientSecret: 'adminpw',
    type: CaRegisterTypeEnum.admin,
    admin: 'admin',
  }

  const registerOrderer0Argv = {
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
    clientId: 'orderer0.org0orderer.bdk.example.com',
    clientSecret: 'org0ordererpw',
    type: CaRegisterTypeEnum.orderer,
    admin: 'admin',
  }

  const registerPeerOrgArgv = {
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
    clientId: 'Admin@org0.bdk.example.com',
    clientSecret: 'adminpw',
    type: CaRegisterTypeEnum.admin,
    admin: 'admin',
  }

  const registerPeer0Argv = {
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
    clientId: 'peer0.org0.bdk.example.com',
    clientSecret: 'org0peerpw',
    type: CaRegisterTypeEnum.peer,
    admin: 'admin',
  }

  const enrollInvalidArgv = {
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
    clientId: 'peer0.org0.bdk.example.com',
    clientSecret: 'org0peerpw',
    type: 'invalidType',
    role: 'peer',
    orgHostname: 'org0.bdk.example.com',
  }

  const reenrollOrderer0Argv = {
    clientId: 'orderer0.org0orderer.bdk.example.com',
    clientSecret: 'org0ordererpw',
    upstream: 'ica.org0.cathaybc.com',
    upstreamPort: 7154,
  }

  before(() => {
    caService = new Ca(config)
  })

  describe('Fabric.CA.enrollRCA', function () {
    after(() => {
      try {
        fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true, force: true })
      } catch (e) {
        console.warn('Cleanup failed:', e)
      }
    })

    it('up & down', async () => {
      await caService.up(rcaArgv)
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect(rcaArgv.basic.port, '127.0.0.1', async () => {
          await caService.down({ caName: rcaArgv.basic.caName })
          resolve()
        })
        socket.on('error', (err) => {
          reject(new Error(`ca connect test error: ${err.message}`))
        })
      })
    })
  })

  describe('Fabric.CA.enrollICA', function () {
    before(async () => {
      await caService.up(rcaArgv)
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect(rcaArgv.basic.port, '127.0.0.1', async () => {
          await sleep(1000)
          resolve()
        })
        socket.on('error', (err) => {
          reject(new Error(`rca connect test error: ${err.message}`))
        })
      })
    })

    after(async () => {
      await caService.down({ caName: rcaArgv.basic.caName })
      try {
        fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true, force: true })
      } catch (e) {
        console.warn('Cleanup failed:', e)
      }
    })

    it('enroll client', async () => {
      await caService.enroll(enrollRcaClientArgv)

      const caPath = `${config.infraConfig.bdkPath}/${config.networkName}/ca`

      // folder
      assert.strictEqual(fs.existsSync(`${caPath}`), true)

      // yaml
      assert.strictEqual(fs.existsSync(`${caPath}/${rcaArgv.basic.adminUser}@${rcaArgv.basic.caName}/fabric-ca-client-config.yaml`), true)

      // ca
      assert.strictEqual(fs.existsSync(`${caPath}/${rcaArgv.basic.caName}/crypto/ca-cert.pem`), true)

      // tls
      assert.strictEqual(fs.existsSync(`${caPath}/${rcaArgv.basic.caName}/crypto/tls-cert.pem`), true)
    })

    it('register ica', async () => {
      await caService.register(registerIcaArgv)
    })
  })

  describe('Fabric.CA.enrollOrg', function () {
    this.timeout(60000)
    before(async () => {
      await caService.up(rcaArgv)
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect(rcaArgv.basic.port, '127.0.0.1', async () => {
          await sleep(1000)
          await caService.enroll(enrollRcaClientArgv)
          await caService.register(registerIcaArgv)
          await caService.up(icaArgv)
          const socket = net.connect(icaArgv.basic.port, '127.0.0.1', () => {
            resolve()
          })
          socket.on('error', (err) => {
            reject(new Error(`ica connect test error: ${err.message}`))
          })
          resolve()
        })
        socket.on('error', (err) => {
          reject(new Error(`rca connect test error: ${err.message}`))
        })
      })
    })

    after(async () => {
      await caService.down({ caName: rcaArgv.basic.caName })
      await caService.down({ caName: icaArgv.basic.caName })
      try {
        fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true, force: true })
      } catch (e) {
        console.warn('Cleanup failed:', e)
      }
    })

    it('enroll && register orderer', async () => {
      await sleep(1000)
      await caService.enroll(enrollOrdererClientArgv)
      await caService.register(registerOrdererOrgArgv)
      await caService.enroll(enrollOrdererOrgArgv)
      await caService.register(registerOrderer0Argv)
      await caService.enroll(enrollOrderer0Argv)
      const caPath = `${config.infraConfig.bdkPath}/${config.networkName}/ca`
      const ordererOrgPath = `${config.infraConfig.bdkPath}/${config.networkName}/ordererOrganizations/${enrollOrdererOrgArgv.orgHostname}`

      // folder
      assert.strictEqual(fs.existsSync(`${caPath}`), true)
      assert.strictEqual(fs.existsSync(`${ordererOrgPath}`), true)

      // ca
      assert.strictEqual(fs.existsSync(`${caPath}/${enrollOrdererOrgArgv.clientId}@${enrollOrdererOrgArgv.upstream}/user/cacerts`), true)
      assert.strictEqual(fs.existsSync(`${caPath}/${enrollOrderer0Argv.clientId}@${enrollOrderer0Argv.upstream}/msp/cacerts`), true)
      assert.strictEqual(fs.existsSync(`${ordererOrgPath}/ca/ca.${enrollOrdererOrgArgv.orgHostname}-cert.pem`), true)

      // tls
      assert.strictEqual(fs.existsSync(`${caPath}/${enrollOrderer0Argv.clientId}@${enrollOrderer0Argv.upstream}/tls/tlsintermediatecerts`), true)
      assert.strictEqual(fs.existsSync(`${caPath}/${enrollOrderer0Argv.clientId}@${enrollOrderer0Argv.upstream}/tls/tlscacerts`), true)
      assert.strictEqual(fs.existsSync(`${ordererOrgPath}/users/Admin@${enrollOrdererOrgArgv.orgHostname}/msp/intermediatecerts`), true)
      assert.strictEqual(fs.existsSync(`${ordererOrgPath}/orderers/${enrollOrderer0Argv.clientId}/tls/tlscacerts`), true)

      // yaml
      assert.strictEqual(fs.existsSync(`${caPath}/${enrollOrderer0Argv.clientId}@${enrollOrderer0Argv.upstream}/fabric-ca-client-config.yaml`), true)
      assert.strictEqual(fs.existsSync(`${ordererOrgPath}/orderers/${enrollOrderer0Argv.clientId}/fabric-ca-client-config.yaml`), true)
    })

    it('enroll && register peer', async () => {
      await caService.enroll(enrollPeerClientArgv)

      await caService.register(registerPeerOrgArgv)
      await caService.enroll(enrollPeerOrgArgv)

      await caService.register(registerPeer0Argv)
      await caService.enroll(enrollPeer0Argv)

      const caPath = `${config.infraConfig.bdkPath}/${config.networkName}/ca`
      const peerOrgPath = `${config.infraConfig.bdkPath}/${config.networkName}/peerOrganizations/${enrollPeerOrgArgv.orgHostname}`

      // folder
      assert.strictEqual(fs.existsSync(`${caPath}`), true)
      assert.strictEqual(fs.existsSync(`${peerOrgPath}`), true)

      // ca
      assert.strictEqual(fs.existsSync(`${caPath}/${enrollPeerOrgArgv.clientId}@${enrollPeerOrgArgv.upstream}/user/cacerts`), true)
      assert.strictEqual(fs.existsSync(`${caPath}/${enrollPeer0Argv.clientId}@${enrollPeer0Argv.upstream}/msp/cacerts`), true)
      assert.strictEqual(fs.existsSync(`${peerOrgPath}/ca/ca.${enrollPeerOrgArgv.orgHostname}-cert.pem`), true)

      // tls
      assert.strictEqual(fs.existsSync(`${caPath}/${enrollPeer0Argv.clientId}@${enrollPeer0Argv.upstream}/tls/tlsintermediatecerts`), true)
      assert.strictEqual(fs.existsSync(`${caPath}/${enrollPeer0Argv.clientId}@${enrollPeer0Argv.upstream}/tls/tlscacerts`), true)
      assert.strictEqual(fs.existsSync(`${peerOrgPath}/users/Admin@${enrollPeerOrgArgv.orgHostname}/msp/intermediatecerts`), true)
      assert.strictEqual(fs.existsSync(`${peerOrgPath}/peers/${enrollPeer0Argv.clientId}/tls/tlscacerts`), true)

      // yaml
      assert.strictEqual(fs.existsSync(`${caPath}/${enrollPeer0Argv.clientId}@${enrollPeer0Argv.upstream}/fabric-ca-client-config.yaml`), true)
      assert.strictEqual(fs.existsSync(`${peerOrgPath}/peers/${enrollPeer0Argv.clientId}/fabric-ca-client-config.yaml`), true)
    })

    it('enroll wrong role', async () => {
      await assert.rejects(async () => {
        await caService.enroll(enrollInvalidArgv as any)
      }, Error)
    })

    it('enroll wrong tls role ', async () => {
      await assert.rejects(async () => {
        await caService.enrollSteps().enrollTls(enrollInvalidArgv as any)
      }, Error)
    })

    it('enroll wrong format', async () => {
      await caService.enrollSteps().format(enrollInvalidArgv as any)
      await caService.enrollSteps().format({ ...enrollPeerOrgArgv, role: 'invalid' })
    })
  })

  describe('Fabric.CA.reenroll', function () {
    this.timeout(60000)
    before(async () => {
      await caService.up(rcaArgv)
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect(rcaArgv.basic.port, '127.0.0.1', async () => {
          await sleep(1000)
          await caService.enroll(enrollRcaClientArgv)
          await caService.register(registerIcaArgv)
          await caService.up(icaArgv)
          const socket = net.connect(icaArgv.basic.port, '127.0.0.1', async () => {
            await sleep(1000)
            resolve()
          })
          socket.on('error', (err) => { reject(new Error(`ica connect test error: ${err.message}`)) })
        })
        socket.on('error', (err) => {
          reject(new Error(`rca connect test error: ${err.message}`))
        })
      })
    })
    after(async () => {
      await caService.down({ caName: rcaArgv.basic.caName })
      await caService.down({ caName: icaArgv.basic.caName })
      try {
        fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true, force: true })
      } catch (e) {
        console.warn('Cleanup failed:', e)
      }
    })

    it('reenroll orderer ca', async () => {
      await sleep(1000)
      await caService.enroll(enrollOrdererClientArgv)
      await caService.register(registerOrdererOrgArgv)
      await caService.enroll(enrollOrdererOrgArgv)
      await caService.register(registerOrderer0Argv)
      await caService.enroll(enrollOrderer0Argv)

      const ordererOrgPath = `${config.infraConfig.bdkPath}/${config.networkName}/ordererOrganizations/${enrollOrdererOrgArgv.orgHostname}`

      await caService.reenroll({ caPath: `${ordererOrgPath}/msp`, ...reenrollOrderer0Argv })
    })
  })
})
