import fs from 'fs'
import YAML from 'js-yaml'
import { WritableStream } from 'memory-streams'
import { spawnSync } from 'child_process'
import Dockerode from 'dockerode'
import { logger } from '../../../util/logger'
import { DockerCreateOptionsType, DockerStartOptionsType, DockerRunCommandType } from '../../../model/type/docker.type'
import config from '../../../config'
import { DockerError, FabricContainerError } from '../../../util/error'
import { DockerResultType, InfraRunner } from '../InfraRunner.interface'
import { DockerComposeYamlInterface } from '../../../model/yaml/docker-compose/dockerComposeYaml'

export class Runner implements InfraRunner<DockerResultType> {
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

  private logger = (content: string) => {
    config.dockerLogging && logger.debug(content)
  }

  public runCommand = async (payload: DockerRunCommandType): Promise<DockerResultType> => {
    await this.checkAndCreateNetwork(payload.network)
    const { image, tag, commands } = payload
    const createOptions: DockerCreateOptionsType = payload.createOptions || {
      Env: (payload.envFile ? fs.readFileSync(payload.envFile, { encoding: 'utf8' }).toString().split(/\n|\r|\r\n/).filter((x) => /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.test(x)) : []).concat(payload.env || []),
      HostConfig: {
        AutoRemove: payload.autoRemove !== undefined ? payload.autoRemove : true,
        NetworkMode: payload.network,
        Binds: payload.volumes,
      },
      User: `${config.UID}:${config.GID}`,
    }
    this.logger(`docker command: \ndocker run ${createOptions.HostConfig?.AutoRemove ? '--rm ' : ''} -u ${config.UID}:${config.GID} ${createOptions.HostConfig?.NetworkMode ? `--network ${createOptions.HostConfig?.NetworkMode} ` : ''}${(createOptions.HostConfig?.Binds || []).map(x => `-v ${x} `).join('')}${(createOptions.Env || []).map(x => `--env ${x} `).join('')}${image}:${tag || 'latest'} ${commands.join(' ')}`)
    const startOptions: DockerStartOptionsType = payload.startOptions || {} as DockerStartOptionsType
    try {
      const stdout = new WritableStream()
      const dockerRunResult = await this.dockerode.run(
        `${image}:${tag || 'latest'}`,
        commands,
        stdout,
        createOptions,
        startOptions)
      this.logger(`run command output: \n${stdout.toString()}`)
      logger.debug(`docker run\n  image: ${image}\n  commands: ${commands.join(' ')}`)
      if (dockerRunResult[0].StatusCode !== 0) {
        throw new FabricContainerError(`[x] [in-docker-container error] ${stdout.toString().split('\r\n').filter(x => x.match(/error/i))}`, stdout.toString())
      }
      return { statusCode: dockerRunResult[0].StatusCode, stdout: stdout.toString() }
    } catch (e: any) {
      if (e instanceof FabricContainerError) { throw e }
      throw new DockerError(`[x] command [docker run]:${e.message}`)
    }
  }

  // TODO use static or constructor
  private checkAndCreateNetwork = async (networkName?: string) => {
    if (networkName) {
      if (!(await this.dockerode.listNetworks()).find(x => x.Name === networkName)) {
        await this.dockerode.createNetwork({ Name: networkName })
      }
    }
  }

  // Docker Compose
  private runSpawnSync (args: Array<string>): string {
    logger.debug(`run spawnSync: docker-compose ${args.join(' ')}`)
    const spawnReturn = spawnSync('docker-compose', [...args])
    // TODO ! docker 裡面的 error 不能這樣抓
    // TODO 如果 docker-compose 不存在不會報錯
    if (spawnReturn.error) {
      throw new DockerError(`[x] command [docker-compose]: ${spawnReturn.error.message}`)
    }
    this.logger(spawnReturn.output.join('\n'))
    return spawnReturn.output.join('\n')
  }

  public upInBackground = async (dockerComposeFile: string) => {
    const networks = (YAML.load(fs.readFileSync(dockerComposeFile).toString()) as DockerComposeYamlInterface).networks
    for (const network in networks) {
      if (networks[network]?.external) {
        await this.checkAndCreateNetwork(network)
      }
    }
    return { stdout: this.runSpawnSync(['-f', dockerComposeFile, 'up', '-d']) }
  }

  // eslint-disable-next-line require-await
  public downAndRemoveVolumes = async (dockerComposeFile: string) => {
    // 為保留其他infra的操作空間，此method的type為(dockerComposeFile: string): Promise<InfraResultType>，雖然裡面沒有await，仍用async
    return { stdout: this.runSpawnSync(['-f', dockerComposeFile, 'down', '--volumes']) }
  }

  // eslint-disable-next-line require-await
  public restart = async (dockerComposeFile: string, service: string[] = []) => {
    // 為保留其他infra的操作空間，此method的type為(dockerComposeFile: string): Promise<InfraResultType>，雖然裡面沒有await，仍用async
    return { stdout: this.runSpawnSync(['-f', dockerComposeFile, 'restart'].concat(service)) }
  }
}
