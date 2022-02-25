/**
 * @requires development - 開發環境
 * @requires testing - 測試環境
 * @requires production - 正式環境
 */
export enum EnvironmentEnum {
  development = 'development',
  testing = 'testing',
  production ='production'
}

/**
 * @requires ORDERER - 組織為 Orderer 型態
 * @requires PEER - 組織為 Peer 型態
 */
export enum OrgTypeEnum {
  ORDERER = 'orderer',
  PEER = 'peer',
}

/**
 * @requires NODE_ENV - [{@link EnvironmentEnum}] 節點的環境類別
 * @requires BDK_NETWORK_NAME - [string] blockchain network 的名稱
 * @requires BDK_ORG_TYPE - [string] org 的型態
 * @requires BDK_ORG_NAME - [string] org 的名稱
 * @requires BDK_ORG_DOMAIN - [string] org 的 domain 名稱
 * @requires BDK_HOSTNAME - [string] hostname 的名稱
 * @requires LOGGER_SILLY - [boolean] 是否要顯示 silly log 資訊
 */
export interface ConfigEnvType {
  NODE_ENV: EnvironmentEnum
  BDK_NETWORK_NAME: string
  BDK_ORG_TYPE: string
  BDK_ORG_NAME: string
  BDK_ORG_DOMAIN: string
  BDK_HOSTNAME: string
  LOGGER_SILLY: boolean
  BDK_DOCKER_HOST_PATH?: string
}

/**
 * @requires key - [string] 設定的參數
 * @requires value - [string] 設定參數的值
 */
export interface ConfigSetType {
  key: string
  value: string
}
