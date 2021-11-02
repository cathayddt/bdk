/**
 * @requires name - [string] orderer org 的名稱
 * @requires domain - [string] orderer org 的 domain 名稱
 * @requires enableNodeOUs - [boolean] orderer org 的 member 中是否再細分身份
 * @requires hostname - [string array]] orderer 的 hostname 名稱
 */
export interface NetworkCryptoConfigOrdererOrgType {
  name: string
  domain: string
  enableNodeOUs: boolean
  hostname: string[]
}

export interface NetworkCryptoConfigPeerOrgType {
  name: string
  domain: string
  enableNodeOUs: boolean
  peerCount: number
  userCount: number
}

/**
 * @requires port - [number] peer 機器的 port
 * @requires operationPort - [number] peer 機器觀測有無連線的 port
 * @requires isPublishPort - [boolean] 是否公開 peer 機器的 port
 * @requires isPublishOperationPort - [boolean] 是否公開 peer 機器觀測有無連線的 port
 */
export interface NetworkPeerPortType {
  port: number
  operationPort: number
  isPublishPort: boolean
  isPublishOperationPort: boolean
}

export interface NetworkOrdererPortType {
  port: number
  operationPort: number
  isPublishPort: boolean
  isPublishOperationPort: boolean
}

/**
 * @requires name - [string] orderer org 的名稱
 * @requires domain - [string] orderer org 的 domain 名稱
 * @requires enableNodeOUs - [boolean] orderer org 的 member 中是否再細分身份
 * @requires hostname - [string array] orderer 的 hostname 名稱
 * @requires ports - [{@link NetworkPeerPortType} array] orderer org 中 port 設定
 */
export interface NetworkCreateOrdererOrgType extends NetworkCryptoConfigOrdererOrgType {
  ports?: NetworkOrdererPortType[]
}

/**
 * @requires name - [string] peer org 的名稱
 * @requires domain - [string] peer org 的 domain 名稱
 * @requires enableNodeOUs - [boolean] peer org 的 member 中是否再細分身份
 * @requires peerCount - [number] peer org 中有幾個 peer
 * @requires userCount - [number] peer org 中有幾個 user
 * @requires ports - [{@link NetworkPeerPortType} array] peer org 中 port 設定
 */
export interface NetworkCreatePeerOrgType extends NetworkCryptoConfigPeerOrgType {
  ports?: NetworkPeerPortType[]
}

/**
 * @requires ordererOrgs - [{@link NetworkCreateOrdererOrgType} array]
 * @requires peerOrgs - [{@link NetworkCreatePeerOrgType} array]
 */
export interface NetworkCreateType {
  ordererOrgs: NetworkCreateOrdererOrgType[]
  peerOrgs: NetworkCreatePeerOrgType[]
}
