import { EnvironmentEnum } from '../../config'

/**
 * @requires NODE_ENV - [{@link EnvironmentEnum}] 節點的環境類別
 * @requires BDK_NETWORK_NAME - [string] blockchain network 的名稱
 * @requires BDK_ORG_TYPE - [string] org 的型態
 * @requires BDK_ORG_NAME - [string] org 的名稱
 * @requires BDK_ORG_DOMAIN - [string] org 的 domain 名稱
 * @requires BDK_HOSTNAME - [string] hostname 的名稱
 * @requires DOCKER_LOGGING - [boolean] 是否要顯示 docker log 資訊
 */
export interface ConfigEnvType {
  NODE_ENV: EnvironmentEnum
  BDK_NETWORK_NAME: string
  BDK_ORG_TYPE: string
  BDK_ORG_NAME: string
  BDK_ORG_DOMAIN: string
  BDK_HOSTNAME: string
  DOCKER_LOGGING: boolean
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
