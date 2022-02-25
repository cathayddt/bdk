/* global describe, it, before, after, beforeEach */
import fs from 'fs'
import assert from 'assert'
import net from 'net'
import Ca from '../../src/service/caService'
import config from '../../src/config'
import { CaEnrollCommandTypeEnum, CaRegisterTypeEnum } from '../../src/model/type/caService.type'

describe('CA service:', function () {
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

  before(() => {
    caService = new Ca(config)
  })

  describe('enroll && register ica', function () {
    after(() => {
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('up & down', (done) => {
      caService.up(rcaArgv).then(() => {
        const socket = net.connect(rcaArgv.basic.port, '127.0.0.1', () => {
          caService.down({ caName: rcaArgv.basic.caName })
            .then(() => {
              // TODO check container
              done()
            })
            .catch((err) => {
              assert.fail(`ca down error: ${err.message}`)
            })
        })

        socket.on('error', (err) => {
          assert.fail(`ca connect test error: ${err.message}`)
        })
      }).catch((err) => {
        assert.fail(`ca up error: ${err.message}`)
      })
    })
  })

  describe('enroll && register ica', function () {
    before((done) => {
      caService.up(rcaArgv).then(() => {
        const socket = net.connect(rcaArgv.basic.port, '127.0.0.1', () => {
          done()
        })
        socket.on('error', (err) => {
          assert.fail(`rca connect test error: ${err.message}`)
        })
      }).catch((err) => {
        assert.fail(`rca up error: ${err.message}`)
      })
    })

    after((done) => {
      caService.down({ caName: rcaArgv.basic.caName })
        .then(() => {
          fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
          done()
        }).catch((err) => { assert.fail(`rca down error: ${err.message}`) })
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

  describe('enroll && register org', function () {
    this.timeout(60000)
    before((done) => {
      caService.up(rcaArgv).then(() => {
        const socket = net.connect(rcaArgv.basic.port, '127.0.0.1', () => {
          caService.enroll(enrollRcaClientArgv).then(() => {
            caService.register(registerIcaArgv).then(() => {
              caService.up(icaArgv).then(() => {
                const socket = net.connect(icaArgv.basic.port, '127.0.0.1', () => {
                  done()
                })
                socket.on('error', (err) => { assert.fail(`ica connect test error: ${err.message}`) })
              }).catch((err) => { assert.fail(`ica up error: ${err.message}`) })
            }).catch((err) => { assert.fail(`rca register ica error: ${err.message}`) })
          }).catch((err) => { assert.fail(`rca enroll client error: ${err.message}`) })
        })
        socket.on('error', (err) => { assert.fail(`rca connect test error: ${err.message}`) })
      }).catch((err) => { assert.fail(`rca up error: ${err.message}`) })
    })

    after((done) => {
      caService.down({ caName: rcaArgv.basic.caName }).then(() => {
        caService.down({ caName: icaArgv.basic.caName }).then(() => {
          fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
          done()
        }).catch((err) => { assert.fail(`ica down error: ${err.message}`) })
      }).catch((err) => { assert.fail(`rca down error: ${err.message}`) })
    })

    it('enroll && register orderer', async () => {
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
  })
})
