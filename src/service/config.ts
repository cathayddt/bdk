import { defaultEnv } from '../config'
import { ConfigSetType, ConfigEnvType } from '../model/type/config.type'
import { logger } from '../util'
import { AbstractService } from './Service.abstract'

export default class Config extends AbstractService {
  /**
   * @description 初始化 blockchain network 環境變數設定
   * @returns .env 檔案（在 ~/.bdk 資料夾底下）
   */
  public init (args: ConfigEnvType = defaultEnv) {
    logger.debug('Config init')

    const initEnv = Object.assign({}, defaultEnv, args)
    this.bdkFile.createEnv(initEnv)
  }

  /**
   * @description 設定/修改 blockchain network 環境變數設定
   */
  public set (args: ConfigSetType) {
    logger.debug(`Config set: set ${args.key} to ${args.value}`)

    const envObj = this.bdkFile.getEnv()
    this.bdkFile.createEnv(Object.assign({}, envObj, { [args.key]: args.value }))
  }

  /**
   * @description 在 log 列出 blockchain network 環境變數設定
   */
  public ls () {
    logger.debug('Config ls')

    return this.bdkFile.getEnv()
  }
}
