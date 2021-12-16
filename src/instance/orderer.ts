import { Config } from '../config'
import { InfraRunnerResultType, InfraRunner } from './infra/InfraRunner.interface'
import { AbstractInstance } from './Instance.abstract'
import { logger } from '../util'
import { InstanceTypeEnum } from './bdkFile'

export default class Orderer extends AbstractInstance {
  private ordererOrgName: string
  private dockerComposePath: string

  constructor (ordererOrgName: string, config: Config, infra: InfraRunner<InfraRunnerResultType>) {
    super(config, infra)
    this.ordererOrgName = ordererOrgName
    this.dockerComposePath = this.bdkFile.getDockerComposeYamlPath(this.ordererOrgName, InstanceTypeEnum.orderer)
  }

  public async up (): Promise<InfraRunnerResultType> {
    logger.debug(`Orderer instance up: ${this.ordererOrgName}`)

    return await this.infra.upInBackground(this.dockerComposePath)
  }

  public async down (): Promise<InfraRunnerResultType> {
    logger.debug(`Orderer instance down: ${this.ordererOrgName}`)
    return await this.infra.downAndRemoveVolumes(this.dockerComposePath)
  }
}
