import { DockerRunCommandType } from '../../model/type/docker.type'
import { K8SRunCommandType, ClusterDeleteType } from '../../model/type/kubernetes.type'
/**
 * Infra return type when direct use docker
 */
export interface DockerResultType {
  statusCode?: number
  stdout: string
}

/**
 * Infra return type when use agent or custom infra
 */
export interface InfraResultType {
  uuid: string
}

export type InfraRunnerResultType = DockerResultType | InfraResultType

// Abstract Methods
export interface InfraRunner<T> {
  runCommand(payload: DockerRunCommandType): Promise<T>
  createContainerAndRun(payload: DockerRunCommandType): Promise<T>
  upInBackground(dockerComposeFile: string): Promise<T>
  upServiceInBackground(dockerComposeFile: string, service: string): Promise<T>
  downAndRemoveVolumes(dockerComposeFile: string): Promise<T>
  downServiceAndRemoveVolumes(dockerComposeFile: string, service: string): Promise<T>
  restart(dockerComposeFile: string, service: string[]): Promise<T>
}

// Kubernetes Methods
export interface KubernetesInfraRunner<T> {
  createDeploymentAndService(payload: K8SRunCommandType): Promise<T>
  createTemplate(payload: K8SRunCommandType): Promise<T>
  wait(job: string, namespace: string): Promise<T>
  deleteDeploymentAndService(payload: ClusterDeleteType): Promise<T>
  listAllRelease(namespace: string): Promise<T>
}

// Strategy
export class InfraStrategy {
  public static createDockerRunner (infraRunner: InfraRunner<DockerResultType>) {
    return infraRunner
  }

  public static createRunner (infraRunner: InfraRunner<InfraRunnerResultType>) {
    return infraRunner
  }

  public static createKubernetesRunner (infraRunner: KubernetesInfraRunner<DockerResultType>) {
    return infraRunner
  }
}
