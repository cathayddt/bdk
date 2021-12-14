import BdkYaml from '../bdkYaml'

interface Client {
  organization: string
  connection: {
    timeout: {
      peer: {
        endorser: string
      }
    }
  }
}

interface Organization {
  mspid: string
  peers: string[]
  certificateAuthorities: string[]
}

interface Peer {
  url: string
  tlsCACerts: {
    pem: string
  }
  grpcOptions: {
    'ssl-target-name-override': string
    hostnameOverride: string
  }
}

interface CertificateAuthorities {
  url: string
  caName: string
  tlsCACerts: {
    pem: string[]
  }
  httpOptions: {
    verify: boolean
  }
}

interface ConnectionProfileInterface {
  name: string
  version: string
  client: Client
  organizations: {[orgName: string]: Organization}
  peers: {[peerName: string]: Peer}
  certificateAuthorities: {[caName: string]: CertificateAuthorities}
}

class ConnectionProfileYaml extends BdkYaml<ConnectionProfileInterface> {
  constructor (value?: ConnectionProfileInterface) {
    super(value)

    this.value.name = 'connection-config'
    this.value.version = '1.0.0'

    !value?.client && this.setDefaultClient()
    !value?.organizations && this.setDefaultOrganizations()
    !value?.peers && this.setDefaultPeers()
    !value?.certificateAuthorities && this.setDefaultCertificateAuthorities()
  }

  private setDefaultClient () {
    this.value.client = {
      organization: 'Org1',
      connection: {
        timeout: {
          peer: {
            endorser: '300',
          },
        },
      },
    }
  }

  private setDefaultOrganizations () {
    this.value.organizations = {}
  }

  private setDefaultPeers () {
    this.value.peers = {}
  }

  private setDefaultCertificateAuthorities () {
    this.value.certificateAuthorities = {}
  }

  private addOrg (org: string) {
    if (!Object.keys(this.value.organizations).includes(org)) {
      this.value.organizations[org] = {
        mspid: `${org}`,
        peers: [],
        certificateAuthorities: [],
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
  public addPeer (org: string, peer: string, tlsPem: string, port: number = 7051) {
    this.addOrg(org)

    this.value.peers[peer] = {
      url: `grpcs://${peer}:${port}`,
      tlsCACerts: {
        pem: tlsPem,
      },
      grpcOptions: {
        'ssl-target-name-override': peer,
        hostnameOverride: peer,
      },
    }

    this.value.organizations[org].peers.push(peer)
  }

  /**
   *
   * @param org - Org1
   * @param ca - ca.org1.example.com
   * @param caName - org1-ca
   * @param tlsPems - ['-----BEGIN CERTIFICATE-----\nXXXXXXXXX...XXXXXX\n-----END CERTIFICATE-----\n']
   * @param port - 7054
   */
  public addCertificateAuthorities (org: string, ca: string, caName: string, tlsPems: string[], port?: number) {
    this.addOrg(org)

    this.value.certificateAuthorities[ca] = {
      url: `https://${ca}:${port || 7054}`,
      caName: caName,
      tlsCACerts: {
        pem: tlsPems,
      },
      httpOptions: {
        verify: false,
      },
    }

    this.value.organizations[org].certificateAuthorities.push(ca)
  }
}

export default ConnectionProfileYaml
