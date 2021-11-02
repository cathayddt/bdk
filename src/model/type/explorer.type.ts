/**
 * @requires networkName - [string] blockchain network 的名稱
 * @requires orgs - [object] peer org 的資訊
 * @requires channels - [object] channel 的資訊
 * @requires clientOrganization - [string] 連接 peer org 的名稱
 */
export interface ExplorerConfigType {
  networkName: string
  orgs: {
    [orgName: string]: { // Org1
      domain: string // org1.example.com
      peers: {
        url: string
        port: number
      }[] // [{url: 'peer0.org1.example.com', port: 7051}, {url: 'peer0.org2.example.com', port: 7051}]
    }
  }
  channels: {
    [channelName: string]: { // mychannel
      orgs: string[] // ['Org1', 'Org2']
    }
  }
  clientOrganization: string // Org1
}

/**
 * @requires peerAddress - peer 的 address
 * @requires orgDomainName - peer org 的 domain 名稱
 */
export interface ExplorerUpForMyOrgType{
  peerAddress: string
  joinedChannel?: string[]
}
