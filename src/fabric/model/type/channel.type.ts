import { OrgTypeEnum } from './config.type'
/**
 * @requires SIGNATURE - 特定簽名
 * @requires IMPLICITMETA - 任意/過半數/全部 channel 中成員簽名
 */
export enum PolicyTypeEnum {
  SIGNATURE = 'Signature',
  IMPLICITMETA = 'ImplicitMeta',
}

/** @ignore */
export enum PolicyStyleEnum {
  ALL_INITIAL_MEMBER = 'All-Initial-Member',
  ANY_INITIAL_MEMBER = 'Any-Initial-Member',
  ANY_MEMBER_IN_CHANNEL = 'Any-Member-in-Channel',
  MAJORITY_MEMBER_IN_CHANNEL = 'Majority-Member-in-Channel',
}

/**
 * @requires GENESIS_BLOCK - 創始區塊
 * @requires LATEST_BLOCK - 最新區塊
 * @requires CONFIG_BLOCK - channel 的設定檔
 */
export enum ChannelConfigEnum {
  GENESIS_BLOCK ='Genesis-Block',
  LATEST_BLOCK = 'Latest-Block',
  CONFIG_BLOCK = 'Config-Block',
}

/**
 * @requires type - [{@link PolicyTypeEnum}] 規則的型態
 * @requires value - [string] 規則的值
 */
export interface ChannelPolicyType {
  type: PolicyTypeEnum
  value: string
}

/**
 * @requires channelName - [string] channel 的名稱
 * @requires orgNames - [string array] 欲加入 channel 中的 peer org 名稱 array
 * @requires channelAdminPolicy - [{@link ChannelPolicyType}] 更動 channel 設定需要的簽名規則
 * @requires lifecycleEndorsement - [{@link ChannelPolicyType}] 部署 chaincode 需要的簽名規則
 * @requires endorsement - [{@link ChannelPolicyType}] chaincode 交易需要簽名的規則
 * @requires orderer - [string] orderer 的 address 和 port
 */
export interface ChannelCreateType {
  channelName: string
  orgNames: string[]
  channelAdminPolicy: ChannelPolicyType
  lifecycleEndorsement: ChannelPolicyType
  endorsement: ChannelPolicyType
  orderer: string
}

/**
 * @requires channelName - [string] channel 的名稱
 * @requires orderer - [string] orderer 的 address 和 port
 */
export interface ChannelJoinType {
  channelName: string
  orderer: string
}

/**
 * @requires channelName - [string] channel 的名稱
 * @requires orderer - [string] orderer 的 address 和 port
 */
export interface ChannelUpdateAnchorPeerType {
  channelName: string
  orderer: string
  port: number
}

/**
 * @requires channelName - [string] channel 的名稱
 * @requires orderer - [string] orderer 的 address 和 port
 * @requires orgType - [{@link OrgTypeEnum}] org 的類型(若不提供則使用config.orgName)
 * @requires configType - [{@link ChannelConfigEnum}] 抓取 channel 資料類型
 * @requires outputFileName - [string] 資料輸出檔案名稱
 */
export interface ChannelFetchBlockType {
  orderer: string
  channelName: string
  orgType?: OrgTypeEnum
  configType: ChannelConfigEnum
  outputFileName: string
}

/** @ignore */
export enum ConfigtxlatorEnum {
  BLOCK = 'common.Block',
  CONFIG = 'common.Config',
  POLICY = 'common.Policy',
  CONFIG_UPDATE = 'common.ConfigUpdate',
  ENVELOPE = 'common.Envelope',
}

/**
 * @requires channelName - [string] channel 的名稱
 */
export interface ChannelApproveType {
  channelName: string
}

/**
 * @requires channelName - [string] channel 的名稱
 * @requires orderer - [string] orderer 的 address 和 port
 */
export interface ChannelUpdateType {
  channelName: string
  orderer: string
}

/**
 * @requires channelName - [string] channel 的名稱
 */
export interface DecodeEnvelopeType {
  channelName: string
}

export enum EnvelopeTypeEnum{
  UPDATE_ANCHOR_PEER = 'UPDATE_ANCHOR_PEER',
  ADD_PEER_TO_APPLICATION_CHANNEL = 'ADD_PEER_TO_APPLICATION_CHANNEL',
  ADD_PEER_TO_SYSTEM_CHANNEL = 'ADD_PEER_TO_SYSTEM_CHANNEL',
  ADD_ORDERER_TO_CHANNEL = 'ADD_ORDERER_TO_CHANNEL',
  ADD_ORDERER_CONSENTER = 'ADD_ORDERER_CONSENTER',
}

export enum EnvelopeVerifyEnum{
  VERIFIED = 'VERIFIED',
  NOT_MATCH = 'NOT_MATCH',
  NO_FILE = 'NO_FILE'
}

export interface DecodeEnvelopeReturnType {
  approved: string[]
  type: EnvelopeTypeEnum
  org?: string
  verify?: EnvelopeVerifyEnum
  anchorPeers? : string[]
  consensus?: string[]
}
