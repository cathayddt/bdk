import Dockerode from 'dockerode'
import { logger } from '../../util/logger'
import { DockerError } from '../../util/error'
import { ContainerListProps } from '../models/type/ui.type'

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

  public async getContainers (): Promise<ContainerListProps[]> {
    const containers = await this.dockerode.listContainers({
      all: true,
    })
    return Promise.resolve(containers.map(container => ({
      id: container.Id,
      names: container.Names,
      image: container.Image,
      status: container.Status,
      state: container.State,
      created: container.Created,
    })))
  }
}
