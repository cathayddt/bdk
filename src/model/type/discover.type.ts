/**
 * @requires channel - [string] channel 名稱
 * @requires chaincode - [string] chaincode 名稱
 */
export interface DiscoverPeersType {
  channel: string
}

/**
 * @requires channel - [string] channel 名稱
 */
export interface DiscoverChannelConfigType {
  channel: string
}

/**
 * @requires channel - [string] channel 名稱
 * @requires chaincode - [string] chaincode 名稱
 */
export interface DiscoverChaincodeEndorsersType {
  channel: string
  chaincode: string
}

interface OuIdentifierType {
  certificate: string
  organizational_unit_identifier: string
}

interface OrdererEndpointType {
  host: string
  port: number
}

export type DiscoverPeersResultType = {
  MSPID: string
  LedgerHeight: number
  Endpoint: string
  Identity: string
  Chaincodes: string[]
}[]

export interface DiscoverChannelConfigResultType {
  msps: {
    [msp: string]: {
      name: string
      root_certs: string[]
      crypto_config: {
        signature_hash_family: string
        identity_identifier_hash_function: string
      }
      tls_root_certs: string[]
      fabric_node_ous: {
        enable: boolean
        client_ou_identifier: OuIdentifierType
        peer_ou_identifier: OuIdentifierType
        admin_ou_identifier: OuIdentifierType
        orderer_ou_identifier: OuIdentifierType
      }
    }
  }
  orderers: {
    [msp: string]: {
      endpoint: OrdererEndpointType[]
    }
  }
}

export type DiscoverChaincodeEndorsersResultType = {
  Chaincode: string
  EndorsersByGroups: {
    [group: string]: {
      MSPID: string
      LedgerHeight: number
      Endpoint: string
      Identity: string
    }[]
  }
  Layouts: {
    quantities_by_group: {
      [group: string]: number
    }
  }[]
}[]
