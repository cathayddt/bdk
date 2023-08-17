import Dockerode from 'dockerode'
import { logger } from '../../util/logger'
import { DockerError } from '../../util/error'
import { execSync } from 'child_process'

export default class ContainerContext {
  private dockerode: Dockerode

  constructor () {
    this.dockerode = new Dockerode({ socketPath: '/var/run/docker.sock' })
    this.dockerode
      .version()
      .then((res) => logger.silly(`Use docker version: ${res.Version}`))
      .catch((e) => {
        throw new DockerError(`[x] command [docker]: ${e.message}`)
      })
  }

  public async getContainers () {
    return await this.dockerode.listContainers()
  }

  public listContainers () {
    return execSync('docker ps -a').toString()
  }
}
