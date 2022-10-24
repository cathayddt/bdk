import { logger } from '../../util'
import { AbstractService } from './Service.abstract'
import ExplorerInstance from '../instance/explorer'
import ExplorerDockerComposeYaml from '../model/yaml/docker-compose/explorerDockerComposeYaml'

export default class Explorer extends AbstractService {
  /**
   * @description 啟動 explorer
   */
  public async create (port: number) {
    logger.debug(`Peer up: ${port}`)
    this.createExplorerDockerCompose(port)
    logger.debug('Starting explorer container')
    return await (new ExplorerInstance(this.config, this.infra).up())
  }

  private createExplorerDockerCompose (port: number) {
    const explorerDockerComposeYaml = new ExplorerDockerComposeYaml(this.bdkFile.getBdkPath(), port)
    this.bdkFile.createExplorerDockerComposeYaml(explorerDockerComposeYaml)
  }
}
