import { NetworkMemberPortType } from './network.type'

/**
 * @requires memberHostname - peer org 的名稱
 */
export interface MemberUpType {
  memberHostname: string
}

/**
 * @requires memberHostname - peer org 的名稱
 */
export interface MemberDownType {
  memberHostname: string
}

/**
 * @requires memberName - [string] peer org 的名稱(若不提供則使用config.orgName)
 * @requires memberDomain - [string] peer org 的 domain 名稱(若不提供則使用config.orgDomainName)
 * @requires memberCount - [number] 欲新增的 peer 個數
 * @requires ports - [{@link NetworkMemberPortType} array] peer org 中 port 設定
 */
export interface MemberAddType {
  memberName?: string
  memberDomain?: string
  memberCount: number
  ports?: NetworkMemberPortType[]
}
