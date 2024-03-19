import { AbstractInstance } from './Instance.abstract'
import { logger } from '../../util'
import { K8SRunCommandType, ClusterDeleteType } from '../model/type/kubernetes.type'

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

  public async delete (payload: ClusterDeleteType) {
    logger.debug('Kubernetes instance delete')
    if (this.kubernetesInfra !== undefined) {
      return await this.kubernetesInfra.deleteDeploymentAndService(payload)
    }
  }

  public async listAllRelease (namespace: string) {
    logger.debug('Kubernetes instance listAllRelease')
    if (this.kubernetesInfra !== undefined) {
      return await this.kubernetesInfra.listAllRelease(namespace)
    }
  }

  public async wait (job: string, namespace: string) {
    logger.debug('Kubernetes instance wait')
    if (this.kubernetesInfra !== undefined) {
      return await this.kubernetesInfra.wait(job, namespace)
    }
  }
}
