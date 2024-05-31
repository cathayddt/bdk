import { Config } from '../config'
import { InfraRunnerResultType, InfraRunner } from './infra/InfraRunner.interface'
import { AbstractInstance } from './Instance.abstract'
import { logger } from '../../util'

export default class Member extends AbstractInstance {
  private dockerComposePath: string

  constructor (config: Config, infra: InfraRunner<InfraRunnerResultType>) {
    super(config, infra)
    this.dockerComposePath = this.bdkFile.getMemberDockerComposeYamlPath()
  }

  public async up (): Promise<InfraRunnerResultType> {
    logger.debug('Member instance up')
    return await this.infra.upInBackground(this.dockerComposePath)
  }
}
