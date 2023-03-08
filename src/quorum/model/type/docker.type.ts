/***************************************************************************************
 * Please reference https://docs.docker.com/engine/api/v1.37/#operation/ContainerCreate
 * for createOptions
 * and
 * https://docs.docker.com/engine/api/v1.37/#operation/ContainerStart
 * for startOptions
 ***************************************************************************************/

export interface DockerHostConfigType {
  Binds?: Array<string> // [ "/a/b/c:/a"]
  PortBindings?: Map<string, Array<string>> // Map("80/udp" => ["localhost","80"])
  AutoRemove?: boolean // --rm
  NetworkMode?: string // name of network
}
export interface DockerCreateOptionsType {
  Name?: string
  Env?: Array<string> // ["VAR=value", ...]
  HostConfig?: DockerHostConfigType
  WorkingDir?: string
  User?: string
  AttachStdout?: boolean
}
export interface DockerStartOptionsType {
  id: string
}

export interface DockerRunCommandType {
  name?: string
  image: string
  user?: boolean
  tag?: string
  stdout?: string
  commands: string[]
  volumes?: string[]
  autoRemove?: boolean
  env?: string[] // ["VAR=value", ...]
  envFile?: string
  network?: string
  createOptions?: DockerCreateOptionsType
  startOptions?: DockerStartOptionsType
  entryPoint?: string
  portBindings?: Map<string, Array<string>>
  ignoreError?: boolean
}
