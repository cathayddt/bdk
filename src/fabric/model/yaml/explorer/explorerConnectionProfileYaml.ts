import BdkYaml from '../bdkYaml'
import ConnectionProfileYaml from '../network/connectionProfileYaml'

interface Client {
  tlsEnable: boolean
  adminCredential: {
    id: string
    password: string
  }
  enableAuthentication: boolean
  organization: string
  connection: {
    timeout: {
      peer: {
        endorser: string
      }
      orderer: string
    }
  }
}

interface Channel {
  peers: {[peerAddress: string]: any}
  connection: {
    timeout: {
      peer: {
        endorser: string
        eventHub: string
        eventReg: string
      }
    }
  }
}

interface Organization {
  mspid: string
  adminPrivateKey: { pem: string }
  peers: string[]
  signedCert: { pem: string }
}

interface Peer {
  url: string
  tlsCACerts: { pem: string }
}

interface ExplorerConnectionProfileInterface {
  name: string
  version: string
  client: Client
  channels: {[channelName: string]: Channel}
  organizations: {[orgName: string]: Organization}
  peers: {[peerName: string]: Peer}
}

class ExplorerConnectionProfileYaml extends BdkYaml<ExplorerConnectionProfileInterface> {
  constructor (value?: ExplorerConnectionProfileInterface) {
    super(value)

    this.value.version = value?.version || '1.0.0'
    this.setDefaultClient()
    this.setDefaultChannels()
    this.setDefaultOrganizations()
    this.setDefaultPeers()
  }

  private setDefaultClient () {
    this.value.client = {
      tlsEnable: true,
      adminCredential: {
        id: 'exploreradmin',
        password: 'exploreradminpw',
      },
      enableAuthentication: true,
      organization: '',
      connection: {
        timeout: {
          peer: {
            endorser: '300',
          },
          orderer: '300',
        },
      },
    }
  }

  private setDefaultChannels () {
    this.value.channels = {}
  }

  private setDefaultOrganizations () {
    this.value.organizations = {}
  }

  private setDefaultPeers () {
    this.value.peers = {}
  }

  public setAdminCredential (id: string, password: string) {
    this.value.client.adminCredential = { id, password }
  }

  public loadFromPeerConnectionProfile (peerConnectProfile: ConnectionProfileYaml) {
    Object.keys(peerConnectProfile.value.organizations).forEach(org => {
      this.value.organizations[org] = {
        ...peerConnectProfile.value.organizations[org],
        adminPrivateKey: { pem: '' },
        signedCert: { pem: '' },
      }
    })
    this.value.peers = peerConnectProfile.value.peers
  }

  private addOrg (org: string) {
    if (!Object.keys(this.value.organizations).includes(org)) {
      this.value.organizations[org] = {
        mspid: `${org}`,
        adminPrivateKey: { pem: '' },
        peers: [],
        signedCert: { pem: '' },
      }
    }
  }

  public setName (name: string) {
    this.value.name = name
  }

  public setVersion (version: string) {
    this.value.version = version
  }

  public setClientOrganization (orgName: string) {
    this.value.client.organization = orgName
  }

  /**
   *
   * @param org - Org1
   * @param peer - peer0.org1.example.com
   * @param tlsPem - -----BEGIN CERTIFICATE-----\nXXXXXXXXX...XXXXXX\n-----END CERTIFICATE-----\n
   * @param port - 7051
   */
  public addPeer (org: string, peer: string, tlsPem: string, port: number) {
    this.addOrg(org)

    this.value.peers[peer] = {
      url: `grpcs://${peer}:${port}`,
      tlsCACerts: {
        pem: tlsPem,
      },
    }
    this.value.organizations[org].peers.push(peer)
  }

  /**
   *
   * @param org - Org1
   * @param adminPrivateKeyPem - -----BEGIN PRIVATE KEY-----\nXXXXXXXXX...XXXXXX\n-----END PRIVATE KEY-----\n\
   * @param signedCertPem - -----BEGIN CERTIFICATE-----\nXXXXXXXXX...XXXXXX\n-----END CERTIFICATE-----\n\
   */
  public setOrgKey (org: string, adminPrivateKeyPem: string, signedCertPem: string) {
    this.value.organizations[org].adminPrivateKey = { pem: adminPrivateKeyPem }
    this.value.organizations[org].signedCert = { pem: signedCertPem }
  }

  /**
   *
   * @param channelName - mychannel
   * @param peers - ['peer0.org1.example.com', 'peer0.org2.example.com']
   */
  public addChannel (channelName: string, peers: string[]) {
    this.value.channels[channelName] = {
      peers: peers.reduce((accumulator, currentValue) => ({ ...accumulator, [currentValue]: {} }), {}),
      connection: {
        timeout: {
          peer: {
            endorser: '6000',
            eventHub: '6000',
            eventReg: '6000',
          },
        },
      },
    }
  }
}

export default ExplorerConnectionProfileYaml
