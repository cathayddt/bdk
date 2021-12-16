import { Config } from '../config'
import { InfraRunnerResultType, InfraRunner } from './infra/InfraRunner.interface'
import { AbstractInstance } from './Instance.abstract'
import { logger } from '../util'
import { InstanceTypeEnum } from './bdkFile'

export default class CA extends AbstractInstance {
  private caName: string
  private dockerComposePath: string

  constructor (caName: string, config: Config, infra: InfraRunner<InfraRunnerResultType>) {
    super(config, infra)
    this.caName = caName
    this.dockerComposePath = this.bdkFile.getDockerComposeYamlPath(this.caName, InstanceTypeEnum.ca)
  }

  public async up (): Promise<InfraRunnerResultType> {
    logger.debug(`CA instance up: ${this.caName}`)
    return await this.infra.upInBackground(this.dockerComposePath)
  }

  public async down (): Promise<InfraRunnerResultType> {
    logger.debug(`CA instance down: ${this.caName}`)
    return await this.infra.downAndRemoveVolumes(this.dockerComposePath)
  }
}
