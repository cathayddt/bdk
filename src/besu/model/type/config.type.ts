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
 * @requires VALIDATOR - 節點為 validator 型態
 * @requires MEMBER - 節點為 member 型態
 */
export enum NodeTypeEnum {
  VALIDATOR = 'validator',
  MEMBER = 'member',
}

/**
 * @requires key - [string] 設定的參數
 * @requires value - [string] 設定參數的值
 */
export interface ConfigSetType {
  key: string
  value: string
}
