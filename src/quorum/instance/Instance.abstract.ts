import { Config } from '../config'
import BdkFile from './bdkFile'
import { InfraRunner, InfraRunnerResultType } from './infra/InfraRunner.interface'

export abstract class AbstractInstance {
  /** @ignore */
  protected config: Config
  /** @ignore */
  protected infra: InfraRunner<InfraRunnerResultType>
  /** @ignore */
  protected bdkFile: BdkFile
  /** @ignore */
  protected hostPath: string
  /** @ignore */
  protected dockerPath: string

  constructor (config: Config, infra: InfraRunner<InfraRunnerResultType>) {
    this.config = config
    this.infra = infra
    this.bdkFile = new BdkFile(config)
    this.hostPath = config.infraConfig.dockerHostPath
    this.dockerPath = config.infraConfig.dockerPath
  }
}
