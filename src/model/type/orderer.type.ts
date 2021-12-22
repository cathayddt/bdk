import { NetworkOrdererPortType } from './network.type'

/**
 * @requires ordererHostName - orderer org 的名稱
 */
export interface OrdererUpType {
  ordererHostname: string
}

/**
 * @requires ordererHostName - orderer org 的名稱
 */
export interface OrdererDownType {
  ordererHostname: string
}

/**
 * @requires orgName - [string] orderer org 的名稱(若不提供則使用config.orgName)
 * @requires orgDomain - [string] orderer org domain 的名稱(若不提供則使用config.orgName)
 * @requires ordererHostnames - [string array] orderer 的 hostname 名稱
 * @requires genesisFileName - [string] 創始區塊的檔案名稱
 * @requires ports - [{@link NetworkPeerPortType} array] orderer org 中 port 設定
 */
export interface OrdererAddType {
  orgName?: string
  orgDomain?: string
  ordererHostnames: string[]
  genesisFileName: string
  ports?: NetworkOrdererPortType[]
}

export interface ConsenterType {
  clientTlsCert: string
  host: string
  port: number
  serverTlsCert: string
}

/**
 * @requires orderer - [string] 使用 orderer 的 address 和 port
 * @requires channelName - [string] channel 的名稱
 * @requires orgName - [string] orderer org 的名稱
 * @requires isUpdate - [boolean] 是否要執行更新 channel 的設定檔
 */
export interface OrdererAddOrgToChannelType {
  orderer: string
  channelName: string
  orgName: string
}

/**
 * @requires hostname - [string] orderer org 的 hostname 名稱
 */
export interface OrdererAddConsenterToChannelType extends OrdererAddOrgToChannelType {
  hostname: string
}
