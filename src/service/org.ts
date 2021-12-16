import { logger } from '../util'
import { OrgJsonType } from '../model/type/org.type'
import { AbstractService } from './Service.abstract'
import FabricTools from '../instance/fabricTools'
import ConfigtxYaml from '../model/yaml/network/configtx'

export default class Org extends AbstractService {
  /**
   * @description 匯入 org 的 json 設定檔
   */
  public importConfig (data: OrgJsonType[]) {
    data.forEach(org => {
      logger.debug(`Import org config: ${org.name}`)

      this.bdkFile.createOrgDefinitionJson(org.name, org.json)
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

    this.bdkFile.createExportOrgDefinitionJson(exportPeerOrgJson, path)
  }

  /**
   * @description 由 config.yaml 建立 peer org 的 json 檔案
   * @param orgName - peer org 的名稱
   * @returns 在 blockchain network 資料夾底下 org-json/[peer org 名稱].json 檔案
   */
  // create new org configtx yaml
  public async createOrgDefinitionJson (orgName: string, configtxYaml: ConfigtxYaml) {
    logger.debug(`Generate ${orgName} config json file: configtxgen ${this.config.infraConfig.bdkPath}/${this.config.networkName}/org-json/${orgName}.json`)

    this.bdkFile.createConfigtx(configtxYaml)
    const orgJson = (await (new FabricTools(this.config, this.infra)).printOrgDefinitionJson(orgName)).stdout.match(/{.*}/s)?.[0] || ''

    this.bdkFile.createOrgDefinitionJson(orgName, orgJson)
  }
}
