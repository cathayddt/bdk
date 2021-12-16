import { Config } from '../config'
import { InfraRunnerResultType, InfraRunner } from './infra/InfraRunner.interface'
import { AbstractInstance } from './Instance.abstract'
import { logger } from '../util'
import { InstanceTypeEnum } from './bdkFile'

export default class Peer extends AbstractInstance {
  private peerOrgName: string
  private dockerComposePath: string

  constructor (peerOrgName: string, config: Config, infra: InfraRunner<InfraRunnerResultType>) {
    super(config, infra)
    this.peerOrgName = peerOrgName
    this.dockerComposePath = this.bdkFile.getDockerComposeYamlPath(this.peerOrgName, InstanceTypeEnum.peer)
  }

  public async up (): Promise<InfraRunnerResultType> {
    logger.debug(`Peer instance up: ${this.peerOrgName}`)
    return await this.infra.upInBackground(this.dockerComposePath)
  }

  public async down (): Promise<InfraRunnerResultType> {
    logger.debug(`Peer instance down: ${this.peerOrgName}`)
    return await this.infra.downAndRemoveVolumes(this.dockerComposePath)
  }
}
