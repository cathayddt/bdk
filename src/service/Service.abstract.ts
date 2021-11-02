import { Config } from '../config'
import BdkFile from '../instance/bdkFile'
import { DockerResultType, InfraStrategy, InfraRunnerResultType, InfraRunner } from '../instance/infra/InfraRunner.interface'
import { Runner as DockerRunner } from '../instance/infra/docker/runner'

export interface ParserType {
  [method: string]: (dockerResult: DockerResultType, options?: any) => any
}

export abstract class AbstractService {
  /** @ignore */
  protected config: Config
  /** @ignore */
  protected bdkFile: BdkFile
  /** @ignore */
  protected infra: InfraRunner<InfraRunnerResultType>

  constructor (config: Config, infra?: InfraRunner<InfraRunnerResultType>) {
    this.config = config
    this.bdkFile = new BdkFile(config)

    if (infra === undefined) {
      this.infra = InfraStrategy.createDockerRunner(new DockerRunner())
    } else {
      this.infra = InfraStrategy.createRunner(infra)
    }
  }

  static readonly parser: ParserType

  public setInfra (infra: InfraRunner<InfraRunnerResultType>) {
    this.infra = InfraStrategy.createRunner(infra)
  }
}
