import { logger } from '../util'
import { OrgJsonType } from '../model/type/org.type'
import { AbstractService } from './Service.abstract'

export default class Org extends AbstractService {
  /**
   * @description 匯入 org 的 json 設定檔
   */
  public importConfig (data: OrgJsonType[]) {
    data.forEach(org => {
      logger.info(`[*] Import org config: ${org.name}`)

      this.bdkFile.createOrgConfigJson(org.name, org.json)
    })
  }

  /**
   * @description 匯出 org 的 json 設定檔
   * @param path 匯出檔案的路徑
   */
  public exportConfig (path: string) {
    const orgJson = this.bdkFile.getOrgConfigJson(this.config.orgName)
    const exportPeerOrgJson: OrgJsonType = {
      name: this.config.orgName,
      json: orgJson,
    }

    this.bdkFile.createExportOrgConfigJson(exportPeerOrgJson, path)
  }
}
