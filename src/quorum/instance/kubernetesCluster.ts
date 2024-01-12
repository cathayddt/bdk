import { Config } from '../config'
import { InfraRunnerResultType, DockerResultType, InfraRunner, KubernetesInfraRunner } from './infra/InfraRunner.interface'
import { AbstractInstance } from './Instance.abstract'
import { logger } from '../../util'
import { K8SRunCommandType } from '../model/type/kubernetes.type'

export default class KubernetesInstance extends AbstractInstance {
  public async install (payload: K8SRunCommandType) {
    logger.debug('Kubernetes instance install')
    if (this.kubernetesInfra !== undefined) {
      return await this.kubernetesInfra.createDeploymentAndService(payload)
    }
  }

  public async template (payload: K8SRunCommandType) {
    logger.debug('Kubernetes instance template')
    if (this.kubernetesInfra !== undefined) {
      return await this.kubernetesInfra.createTemplate(payload)
    }
  }
}
