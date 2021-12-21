/* eslint-disable no-use-before-define */
import BdkYaml from '../bdkYaml'

interface ConfigtxInterface {
  Organizations: (PeerOrganizationInterface | OrdererOrganizationInterface)[]
  Profiles: {
    [profileName: string]: SystemChannelProfileInterface | ApplicationChannelProfileInterface
  }
}

// Section: Organizations
// This section defines the different organizational identities which will
// be referenced later in the configuration.
interface OrganizationInterface {
  Name: string
  ID: string // ID to load the MSP definition as
  MSPDir: string // MSPDir is the filesystem path which contains the MSP configuration
}
export interface OrdererOrganizationInterface extends OrganizationInterface {
  Policies: { // Policies defines the set of policies at this level of the config tree. For organization policies, their canonical path is usually /Channel/<Application|Orderer>/<OrgName>/<PolicyName>
    Readers: PolicyInterface
    Writers: PolicyInterface
    Admins: PolicyInterface
  }
  OrdererEndpoints: string[]
}
export interface PeerOrganizationInterface extends OrganizationInterface {
  Policies: { // Policies defines the set of policies at this level of the config tree. For organization policies, their canonical path is usually /Channel/<Application|Orderer>/<OrgName>/<PolicyName>
    Readers: PolicyInterface
    Writers: PolicyInterface
    Admins: PolicyInterface
    Endorsement: PolicyInterface
  }

  AnchorPeers: { // AnchorPeers defines the location of peers which can be used for cross org gossip communication.  Note, this value is only encoded in the genesis block in the Application section context
    Host: string
    Port: number
  }[]
}

// SECTION: Capabilities
// This section defines the capabilities of fabric network. This is a new
// concept as of v1.1.0 and should not be utilized in mixed networks with
// v1.0.x peers and orderers.  Capabilities define features which must be
// present in a fabric binary for that binary to safely participate in the
// fabric network.  For instance, if a new MSP type is added, newer binaries
// might recognize and validate the signatures from this type, while older
// binaries without this support would be unable to validate those
// transactions.  This could lead to different versions of the fabric binaries
// having different world states.  Instead, defining a capability for a channel
// informs those binaries without this capability that they must cease
// processing transactions until they have been upgraded.  For v1.0.x if any
// capabilities are defined (including a map with all capabilities turned off)
// then the v1.0.x peer will deliberately crash.
interface ChannelCapabilityInterface { // Channel capabilities apply to both the orderers and the peers and must be supported by both. Set the value of the capability to true to require it.
  V2_0: boolean // V2_0 capability ensures that orderers and peers behave according to v2.0 channel capabilities. Orderers and peers from prior releases would behave in an incompatible way, and are therefore not able to participate in channels at v2.0 capability. Prior to enabling V2.0 channel capabilities, ensure that all orderers and peers on a channel are at v2.0.0 or later.
}
interface OrdererCapabilityInterface { // Orderer capabilities apply only to the orderers, and may be safely used with prior release peers. Set the value of the capability to true to require it.
  V2_0: boolean // V2_0 orderer capability ensures that orderers behave according to v2.0 orderer capabilities. Orderers from prior releases would behave in an incompatible way, and are therefore not able to participate in channels at v2.0 orderer capability. Prior to enabling V2.0 orderer capabilities, ensure that all orderers on channel are at v2.0.0 or later.
}
interface ApplicationCapabilityInterface { // Application capabilities apply only to the peer network, and may be safely used with prior release orderers. Set the value of the capability to true to require it.
  V2_0: boolean // V2_0 application capability ensures that peers behave according to v2.0 application capabilities. Peers from prior releases would behave in an incompatible way, and are therefore not able to participate in channels at v2.0 application capability. Prior to enabling V2.0 application capabilities, ensure that all peers on channel are at v2.0.0 or later.
}

// SECTION: Application
// This section defines the values to encode into a config transaction or
// genesis block for application related parameters
interface ApplicationInterface {
  Organizations: PeerOrganizationInterface[] // Organizations is the list of orgs which are defined as participants on the application side of the network
  Policies: {// Policies defines the set of policies at this level of the config tree. For Application policies, their canonical path is /Channel/Application/<PolicyName>
    Readers: PolicyInterface
    Writers: PolicyInterface
    Admins: PolicyInterface
    LifecycleEndorsement: PolicyInterface
    Endorsement: PolicyInterface
  }
  Capabilities: ApplicationCapabilityInterface
}
const applicationDefaults: ApplicationInterface = {
  Organizations: [],
  Policies: {
    Readers: {
      Type: 'ImplicitMeta',
      Rule: 'ANY Readers',
    },
    Writers: {
      Type: 'ImplicitMeta',
      Rule: 'ANY Writers',
    },
    Admins: {
      Type: 'ImplicitMeta',
      Rule: 'MAJORITY Admins',
    },
    LifecycleEndorsement: {
      Type: 'ImplicitMeta',
      Rule: 'MAJORITY Endorsement',
    },
    Endorsement: {
      Type: 'ImplicitMeta',
      Rule: 'MAJORITY Endorsement',
    },
  },
  Capabilities: {
    V2_0: true,
  },
}
// SECTION: Orderer
// This section defines the values to encode into a config transaction or
// genesis block for orderer related parameters
interface OrdererInterface {
  OrdererType: string // Orderer Type: The orderer implementation to start
  Addresses: string[] // Addresses used to be the list of orderer addresses that clients and peers  could connect to.  However, this does not allow clients to associate orderer addresses and orderer organizations which can be useful for things such as TLS validation.  The preferred way to specify orderer addresses is now to include the OrdererEndpoints item in your org definition
  EtcdRaft: {
    Consenters: EtcdRaftConsentersInterface[]
  }
  BatchTimeout: string // Batch Timeout: The amount of time to wait before creating a batch
  BatchSize: BatchSizeInterface // Batch Size: Controls the number of messages batched into a block
  Organizations: OrdererOrganizationInterface[] // Organizations is the list of orgs which are defined as participants on the orderer side of the network
  Policies: { // Policies defines the set of policies at this level of the config tree. For Orderer policies, their canonical path is /Channel/Orderer/<PolicyName>
    Readers: PolicyInterface
    Writers: PolicyInterface
    Admins: PolicyInterface
    BlockValidation: PolicyInterface // BlockValidation specifies what signatures must be included in the block from the orderer for the peer to validate it.
  }
  Capabilities: OrdererCapabilityInterface
}
interface EtcdRaftConsentersInterface {
  Host: string
  Port: number
  ClientTLSCert: string
  ServerTLSCert: string
}
interface BatchSizeInterface { // Batch Size: Controls the number of messages batched into a block
  MaxMessageCount: number // Max Message Count: The maximum number of messages to permit in a batch
  AbsoluteMaxBytes: string // Absolute Max Bytes: The absolute maximum number of bytes allowed for the serialized messages in a batch.
  PreferredMaxBytes: string // Preferred Max Bytes: The preferred maximum number of bytes allowed for the serialized messages in a batch. A message larger than the preferred max bytes will result in a batch larger than preferred max bytes.
}
const ordererDefaults: OrdererInterface = {
  OrdererType: 'etcdraft',
  Addresses: [],
  EtcdRaft: {
    Consenters: [],
  },
  BatchTimeout: '2s',
  BatchSize: {
    MaxMessageCount: 10,
    AbsoluteMaxBytes: '99 MB',
    PreferredMaxBytes: '512 KB',
  },
  Organizations: [],
  Capabilities: {
    V2_0: true,
  },
  Policies: {
    Readers: {
      Type: 'ImplicitMeta',
      Rule: 'ANY Readers',
    },
    Writers: {
      Type: 'ImplicitMeta',
      Rule: 'ANY Writers',
    },
    Admins: {
      Type: 'ImplicitMeta',
      Rule: 'MAJORITY Admins',
    },
    BlockValidation: {
      Type: 'ImplicitMeta',
      Rule: 'ANY Writers',
    },
  },
}

// CHANNEL
// This section defines the values to encode into a config transaction or
// genesis block for channel related parameters.
interface ChannelInterface {
  Policies: { // Policies defines the set of policies at this level of the config tree. For Channel policies, their canonical path is /Channel/<PolicyName>
    Readers: PolicyInterface // Who may invoke the 'Deliver' API
    Writers: PolicyInterface // Who may invoke the 'Broadcast' API
    Admins: PolicyInterface // By default, who may modify elements at this config level
  }
  Capabilities: ChannelCapabilityInterface // Capabilities describes the channel level capabilities, see the dedicated Capabilities section elsewhere in this file for a full description
}
const channelDefaults: ChannelInterface = {
  Policies: {
    Readers: {
      Type: 'ImplicitMeta',
      Rule: 'ANY Readers',
    },
    Writers: {
      Type: 'ImplicitMeta',
      Rule: 'ANY Writers',
    },
    Admins: {
      Type: 'ImplicitMeta',
      Rule: 'MAJORITY Admins',
    },
  },
  Capabilities: {
    V2_0: true,
  },
}

// Profile
// Different configuration profiles may be encoded here to be specified
// as parameters to the configtxgen tool
interface SystemChannelProfileInterface extends ChannelInterface {
  Orderer: OrdererInterface
  Consortiums: ConsortiumsInterface
}
interface ConsortiumsInterface {
  [consortiumName: string]: {
    Organizations: PeerOrganizationInterface[]
  }
}
interface ApplicationChannelProfileInterface extends ChannelInterface {
  Consortium: string
  Application: ApplicationInterface
}

interface PolicyInterface {
  Type: 'Signature' | 'ImplicitMeta'
  Rule: string
}

export interface ConfigtxOrgs {
  ordererOrgs: { [orgName: string]: OrdererOrganizationInterface }
  peerOrgs: { [orgName: string]: PeerOrganizationInterface }
}

class ConfigtxYaml extends BdkYaml<ConfigtxInterface> {
  public ordererOrgs: { [orgName: string]: OrdererOrganizationInterface }
  public peerOrgs: { [orgName: string]: PeerOrganizationInterface }

  constructor (value?: ConfigtxInterface) {
    const val = value || { Organizations: [], Profiles: {} }
    super(val)
    this.ordererOrgs = {}
    this.peerOrgs = {}
  }

  public addOrdererOrg (payload: { name: string; mspDir: string; domain: string; hostname: string[]; ports?: number[] }) {
    // example:
    // name -> 'Org0Orderer'
    // mspDir -> '/tmp/organizations/ordererOrganizations/org0.cathaybc.com/msp'
    // domain -> 'org0.cathaybc.com'
    // hostname -> ['orderer0', 'orderer1']
    // ports -> [7050, 7150]
    const newOrdererOrg: OrdererOrganizationInterface = {
      Name: payload.name,
      ID: `${payload.name}`,
      MSPDir: payload.mspDir,
      Policies: {
        Readers: {
          Type: 'Signature',
          Rule: `OR('${payload.name}.member')`,
        },
        Writers: {
          Type: 'Signature',
          Rule: `OR('${payload.name}.member')`,
        },
        Admins: {
          Type: 'Signature',
          Rule: `OR('${payload.name}.admin')`,
        },
      },
      OrdererEndpoints: payload.hostname.map((x, i) => (`${x}.${payload.domain}:${payload.ports?.[i] || 7050}`)),
    }

    this.ordererOrgs[payload.name] = newOrdererOrg
    this.value.Organizations.push(newOrdererOrg)
    return newOrdererOrg
  }

  public addPeerOrg (payload: { name: string; mspDir: string; domain: string; anchorPeers: {hostname: string; port?: number}[]}) {
    // example:
    // name -> 'Org0'
    // mspDir -> '/tmp/organizations/peerOrganizations/org0.cathaybc.com/msp'
    // domain -> 'org0.cathaybc.com/msp'
    // anchorPeersIndexes -> [0, 1]
    // ports -> [7051, 7151]
    const newPeerOrg: PeerOrganizationInterface = {
      Name: payload.name,
      ID: payload.name,
      MSPDir: payload.mspDir,
      Policies: {
        Readers: {
          Type: 'Signature',
          Rule: `OR('${payload.name}.admin', '${payload.name}.peer', '${payload.name}.client')`,
        },
        Writers: {
          Type: 'Signature',
          Rule: `OR('${payload.name}.admin', '${payload.name}.client')`,
        },
        Admins: {
          Type: 'Signature',
          Rule: `OR('${payload.name}.admin')`,
        },
        Endorsement: {
          Type: 'Signature',
          Rule: `OR('${payload.name}.peer')`,
        },
      },
      AnchorPeers: payload.anchorPeers.map(anchorPeer => ({ Host: anchorPeer.hostname, Port: anchorPeer.port || 7051 })),
    }

    this.peerOrgs[payload.name] = newPeerOrg
    this.value.Organizations.push(newPeerOrg)
    return newPeerOrg
  }

  public addSystemChannelProfile (payload: { name: string; etcdRaftConsenters: EtcdRaftConsentersInterface[]; ordererOrgs: string[]; consortiums: { [cousortiumName: string]: string[] }; batchTimeout?: string; BatchSize?: BatchSizeInterface }) {
    // example:
    // name -> 'OrdererGenesis'
    // etcdRaftConsenters -> [{ Host: 'orderer0.org0.cathaybc.com',
    //                          Port: 7050,
    //                          ClientTLSCert: '/tmp/organizations/ordererOrganizations/org0.cathaybc.com/orderers/orderer0.org0.cathaybc.com/tls/server.crt',
    //                          ServerTLSCert: '/tmp/organizations/ordererOrganizations/org0.cathaybc.com/orderers/orderer0.org0.cathaybc.com/tls/server.crt' },
    //                        { Host: 'orderer1.org0.cathaybc.com',
    //                          Port: 7050,
    //                          ClientTLSCert: '/tmp/organizations/ordererOrganizations/org0.cathaybc.com/orderers/orderer1.org0.cathaybc.com/tls/server.crt',
    //                          ServerTLSCert: '/tmp/organizations/ordererOrganizations/org0.cathaybc.com/orderers/orderer1.org0.cathaybc.com/tls/server.crt' },
    //                        { Host: 'orderer0.org1.cathaybc.com',
    //                          Port: 7050,
    //                          ClientTLSCert: '/tmp/organizations/ordererOrganizations/org1.cathaybc.com/orderers/orderer0.org1.cathaybc.com/tls/server.crt',
    //                          ServerTLSCert: '/tmp/organizations/ordererOrganizations/org1.cathaybc.com/orderers/orderer0.org1.cathaybc.com/tls/server.crt' }]
    // ordererOrgs -> ['Org0Orderer', 'Org1Orderer']
    // consortiums -> {TestConsortium: ['Org0', 'Org1']}
    // batchTimeout -> '2s'
    // BatchSize -> { MaxMessageCount: 10, AbsoluteMaxBytes: '99 MB', PreferredMaxBytes: '512 KB' }
    const ordererAddresses: string[] = []
    payload.ordererOrgs.forEach(ordererOrg => ordererAddresses.concat(this.ordererOrgs[ordererOrg].OrdererEndpoints))
    const consortiums: ConsortiumsInterface = {}
    Object.entries(payload.consortiums).forEach(([consortiumName, orgNames]) => {
      consortiums[consortiumName] = { Organizations: orgNames.map(x => (this.peerOrgs[x])) }
    })
    const newProfile: SystemChannelProfileInterface = {
      ...channelDefaults,
      Orderer: {
        ...ordererDefaults,
        Addresses: ordererAddresses,
        EtcdRaft: {
          Consenters: payload.etcdRaftConsenters,
        },
        BatchTimeout: payload.batchTimeout || ordererDefaults.BatchTimeout,
        BatchSize: payload.BatchSize || ordererDefaults.BatchSize,
        Organizations: payload.ordererOrgs.map(x => this.ordererOrgs[x]),
      },
      Consortiums: consortiums,
    }
    this.value.Profiles[payload.name] = newProfile
  }

  public addApplicationChannelProfile (payload: { name: string; consortium: string; organizations: string[] }) {
    // example:
    // name -> 'TestChannel'
    // consortium -> 'TestConsortium'
    // organizations -> ['Org0', 'Org1']
    const newProfile: ApplicationChannelProfileInterface = {
      ...channelDefaults,
      Consortium: payload.consortium,
      Application: {
        ...applicationDefaults,
        Organizations: payload.organizations.map(x => (this.peerOrgs[x])),
      },
    }
    this.value.Profiles[payload.name] = newProfile
  }

  public setApplicationChannelPolicy (payload: { profileName: string; policyKey: 'Readers' | 'Writers' | 'Admins' | 'LifecycleEndorsement' | 'Endorsement'; policy: PolicyInterface }) {
    const profile = this.value.Profiles[payload.profileName]
    if ('Application' in profile) {
      profile.Application.Policies[payload.policyKey] = payload.policy
    }
  }

  public importOrgs (data: ConfigtxOrgs) {
    this.ordererOrgs = data.ordererOrgs
    this.peerOrgs = data.peerOrgs
  }
}

export default ConfigtxYaml
