import { logger } from '../../util'
import { AbstractService } from './Service.abstract'
import ExplorerInstance from '../instance/explorer'
import ExplorerDockerComposeYaml from '../model/yaml/docker-compose/explorerDockerComposeYaml'
import { ExplorerCreateType } from '../model/type/explorer.type'

export default class Explorer extends AbstractService {
  /**
   * @description 啟動 explorer
   */
  public async create (payload: ExplorerCreateType) {
    logger.debug(`Explorer up: ${payload.port}`)
    this.createExplorerDockerCompose(payload)
    logger.debug('Starting explorer container')
    return await (new ExplorerInstance(this.config, this.infra).up())
  }

  public async delete () {
    await (new ExplorerInstance(this.config, this.infra).down())
    this.removeBdkFiles(this.getExplorerFiles())
  }

  private createExplorerDockerCompose (payload: ExplorerCreateType) {
    const explorerDockerComposeYaml = new ExplorerDockerComposeYaml(
      this.bdkFile.getBdkPath(),
      payload.httpModeEnabled,
      payload.nodeName,
      payload.port,
      payload.networkType,
    )
    this.bdkFile.createExplorerDockerComposeYaml(explorerDockerComposeYaml)
  }

  /** @ignore */
  public getExplorerFiles () {
    const array = []
    array.push(this.bdkFile.getExportFiles().filter(file => file.match(/(explorer)+/g)))
    const explorerFilesList = array.flat()

    return explorerFilesList
  }

  /** @ignore */
  public removeBdkFiles (files: string[]) {
    for (const file of files) {
      this.bdkFile.removeBdkFiles(file)
    }
  }
}
