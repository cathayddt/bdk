import { NetworkCreateOrdererOrgType, NetworkCreatePeerOrgType } from './network.type'

export interface OrgPeerOrgNameAndDomainType {
  orgName: string
  domain: string
}

/**
 * @requires name - [string] org 的名稱
 * @requires json - [string] org 的 json 設定檔
 */
export interface OrgJsonType {
  name: string
  json: string
}

export interface OrgOrdererCreateType {
  ordererOrgs: NetworkCreateOrdererOrgType[]
  genesisFileName: string
}

export interface OrgPeerCreateType {
  peerOrgs: NetworkCreatePeerOrgType[]
}
