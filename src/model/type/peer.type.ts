import { NetworkPeerPortType } from './network.type'

/**
 * @requires peerHostName - peer org 的名稱
 */
export interface PeerUpType {
  peerHostname: string
}

/**
 * @requires peerHostName - peer org 的名稱
 */
export interface PeerDownType {
  peerHostname: string
}

/**
 * @requires orgName - [string] peer org 的名稱(若不提供則使用config.orgName)
 * @requires orgDomain - [string] peer org 的 domain 名稱(若不提供則使用config.orgDomainName)
 * @requires peerCount - [number] 欲新增的 peer 個數
 * @requires ports - [{@link NetworkPeerPortType} array] peer org 中 port 設定
 */
export interface PeerAddType {
  orgName?: string
  orgDomain?: string
  peerCount: number
  ports?: NetworkPeerPortType[]
}

/**
 * @requires channelName - [string] channel 的名稱
 * @requires orgNames - [string array] peer org 的名稱
 */
export interface PeerAddOrgToChannelType {
  channelName: string
  orgName: string
}

/**
 * @requires orderer - [string] 使用 orderer 的 address 和 port
 */
export interface PeerAddOrgToSystemChannelType extends PeerAddOrgToChannelType {
  orderer: string
}
