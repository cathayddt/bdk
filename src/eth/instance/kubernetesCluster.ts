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
      try {
        await this.kubernetesInfra.deleteNamespace(payload.namespace)
        logger.info(`Successfully deleted namespace ${payload.namespace}`)
      } catch (error) {
        logger.error(`Failed to delete namespace ${payload.namespace}:`, error)
        try {
          await this.kubernetesInfra.forceDeleteNamespace(payload.namespace)
          logger.info(`Successfully force deleted namespace ${payload.namespace}`)
        } catch (forceError) {
          logger.error(`Failed to force delete namespace ${payload.namespace}:`, forceError)
        }
      }
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

  public async deleteNamespace (namespace: string): Promise<void> {
    logger.debug(`Deleting namespace ${namespace}`)
    if (this.kubernetesInfra !== undefined) {
      await this.kubernetesInfra.deleteNamespace(namespace)
    }
  }

  public async forceDeleteNamespace (namespace: string): Promise<void> {
    logger.debug(`Force deleting namespace ${namespace}`)
    if (this.kubernetesInfra !== undefined) {
      await this.kubernetesInfra.forceDeleteNamespace(namespace)
    }
  }
}
