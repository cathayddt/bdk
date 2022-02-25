import fs from 'fs'
import stream from 'stream'
import YAML from 'js-yaml'
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
  private existingImages: { [key: string]: boolean } = {}

  constructor () {
    this.dockerode = new Dockerode({ socketPath: '/var/run/docker.sock' })

    this.dockerode
      .version()
      .then((res) => logger.silly(`Use docker version: ${res.Version}`))
      .catch((e) => {
        throw new DockerError(`[x] command [docker]: ${e.message}`)
      })
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
    if (!this.existingImages[`${image}:${tag}`]) {
      const images = await this.dockerode.listImages({ filters: { reference: [`${image}:${tag}`] } })
      if (images.length === 0) {
        await this.dockerode.pull(`${image}:${tag}`)
        while (true) {
          const images = await this.dockerode.listImages({ filters: { reference: [`${image}:${tag}`] } })
          if (images.length !== 0) break
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        this.existingImages[`${image}:${tag}`] = true
      }
    }
    logger.silly(`docker command: \ndocker run ${createOptions.HostConfig?.AutoRemove ? '--rm ' : ''} -u ${config.UID}:${config.GID} ${createOptions.HostConfig?.NetworkMode ? `--network ${createOptions.HostConfig?.NetworkMode} ` : ''}${(createOptions.HostConfig?.Binds || []).map(x => `-v ${x} `).join('')}${(createOptions.Env || []).map(x => `--env ${x} `).join('')}${image}:${tag || 'latest'} ${commands.join(' ')}`)
    const startOptions: DockerStartOptionsType = payload.startOptions || {} as DockerStartOptionsType
    try {
      let stdout = ''
      const stdoutStream = new stream.Writable({
        write: function (chunk, encoding, callback) {
          stdout += chunk.toString()
          callback()
        },
      })
      const dockerRunResult = await this.dockerode.run(
        `${image}:${tag || 'latest'}`,
        commands,
        stdoutStream,
        createOptions,
        startOptions)
      logger.silly(`run command output: \n${stdout}`)
      logger.debug(`docker run\n  image: ${image}\n  commands: ${commands.join(' ')}`)
      if (dockerRunResult[0].StatusCode !== 0) {
        throw new FabricContainerError(`[x] [in-docker-container error] ${stdout.split('\r\n').filter(x => x.match(/error/i) || stdout)}`, stdout)
      }
      return { statusCode: dockerRunResult[0].StatusCode, stdout }
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
    logger.silly(spawnReturn.output.join('\n'))
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
