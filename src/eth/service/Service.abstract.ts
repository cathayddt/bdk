import { Config } from '../config'
import BdkFile from '../instance/bdkFile'
import { DockerResultType, InfraStrategy, InfraRunnerResultType, InfraRunner, KubernetesInfraRunner } from '../instance/infra/InfraRunner.interface'
import { Runner as DockerRunner } from '../instance/infra/docker/runner'
import { Runner as KubernetesRunner } from '../instance/infra/kubernetes/runner'
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
  /** @ignore */
  protected kubernetesInfra: KubernetesInfraRunner<InfraRunnerResultType>

  constructor (
    config: Config,
    networkType: string,
    infra?: InfraRunner<InfraRunnerResultType>,
    kubernetesInfra?: KubernetesInfraRunner<DockerResultType>,
  ) {
    this.config = {
      ...config,
      networkName: `bdk-${networkType}-network`,
    }
    this.bdkFile = new BdkFile(config, config.networkName, config.networkType)

    if (infra === undefined) {
      this.infra = InfraStrategy.createDockerRunner(new DockerRunner())
    } else {
      this.infra = InfraStrategy.createRunner(infra)
    }

    if (kubernetesInfra === undefined) {
      this.kubernetesInfra = InfraStrategy.createKubernetesRunner(new KubernetesRunner())
    } else {
      this.kubernetesInfra = InfraStrategy.createKubernetesRunner(kubernetesInfra)
    }
  }

  static readonly parser: ParserType

  public setInfra (infra: InfraRunner<InfraRunnerResultType>) {
    this.infra = InfraStrategy.createRunner(infra)
  }
}
