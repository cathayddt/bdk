import { DockerRunCommandType } from '../../model/type/docker.type'

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
  upInBackground(dockerComposeFile: string): Promise<T>
  downAndRemoveVolumes(dockerComposeFile: string): Promise<T>
  restart(dockerComposeFile: string, service: string[]): Promise<T>
}

// Strategy
export class InfraStrategy {
  public static createDockerRunner (infraRunner: InfraRunner<DockerResultType>) {
    return infraRunner
  }

  public static createRunner (infraRunner: InfraRunner<InfraRunnerResultType>) {
    return infraRunner
  }
}
