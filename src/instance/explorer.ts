import { Config } from '../config'
import { InfraRunnerResultType, InfraRunner } from './infra/InfraRunner.interface'
import { AbstractInstance } from './Instance.abstract'
import { logger } from '../util'

export default class Explorer extends AbstractInstance {
  private dockerComposePath: string

  constructor (config: Config, infra: InfraRunner<InfraRunnerResultType>) {
    super(config, infra)
    this.dockerComposePath = this.bdkFile.getExplorerDockerComposeYamlPath()
  }

  public async up (): Promise<InfraRunnerResultType> {
    logger.info('[*] Explorer instance up')
    return await this.infra.upInBackground(this.dockerComposePath)
  }

  public async down (): Promise<InfraRunnerResultType> {
    logger.info('[*] Explorer instance down')
    return await this.infra.downAndRemoveVolumes(this.dockerComposePath)
  }

  public async restart (): Promise<InfraRunnerResultType> {
    logger.info('[*] Explorer instance restart')
    return await this.infra.restart(this.dockerComposePath, [`explorer.${this.config.networkName}`])
  }
}
