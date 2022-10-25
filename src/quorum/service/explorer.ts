import { logger } from '../../util'
import { AbstractService } from './Service.abstract'
import ExplorerInstance from '../instance/explorer'
import ExplorerDockerComposeYaml from '../model/yaml/docker-compose/explorerDockerComposeYaml'

export default class Explorer extends AbstractService {
  /**
   * @description 啟動 explorer
   */
  public async create (port: number) {
    logger.debug(`Explorer up: ${port}`)
    this.createExplorerDockerCompose(port)
    logger.debug('Starting explorer container')
    return await (new ExplorerInstance(this.config, this.infra).up())
  }

  public async delete () {
    await (new ExplorerInstance(this.config, this.infra).down())
  }

  private createExplorerDockerCompose (port: number) {
    const explorerDockerComposeYaml = new ExplorerDockerComposeYaml(this.bdkFile.getBdkPath(), port)
    this.bdkFile.createExplorerDockerComposeYaml(explorerDockerComposeYaml)
  }
}
