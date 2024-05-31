import { Config } from '../config'
import { InfraRunnerResultType, InfraRunner } from './infra/InfraRunner.interface'
import { AbstractInstance } from './Instance.abstract'
import { logger } from '../../util'

export default class Validator extends AbstractInstance {
  private dockerComposePath: string

  constructor (config: Config, infra: InfraRunner<InfraRunnerResultType>) {
    super(config, infra)
    this.dockerComposePath = this.bdkFile.getValidatorDockerComposeYamlPath()
  }

  public async up (): Promise<InfraRunnerResultType> {
    logger.debug('Validator instance up')
    return await this.infra.upInBackground(this.dockerComposePath)
  }
}
