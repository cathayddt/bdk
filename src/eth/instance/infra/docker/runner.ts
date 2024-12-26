import fs from 'fs'
import stream from 'stream'
import YAML from 'js-yaml'
import { spawn } from 'child_process'
import Dockerode from 'dockerode'
import { logger } from '../../../../util/logger'
import { DockerCreateOptionsType, DockerStartOptionsType, DockerRunCommandType } from '../../../model/type/docker.type'
import config from '../../../config'
import { DockerError, EthContainerError } from '../../../../util/error'
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
    const { image, tag, commands, ignoreError } = payload
    const createOptions: DockerCreateOptionsType = payload.createOptions || {
      AttachStdout: true,
      Env: (payload.envFile ? fs.readFileSync(payload.envFile, { encoding: 'utf8' }).toString().split(/\n|\r|\r\n/).filter((x) => /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.test(x)) : []).concat(payload.env || []),
      HostConfig: {
        AutoRemove: payload.autoRemove !== undefined ? payload.autoRemove : true,
        NetworkMode: payload.network,
        Binds: payload.volumes,
      },
      User: (payload.user !== false) ? `${config.UID}:${config.GID}` : '',
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
      if (dockerRunResult[0].StatusCode !== 0 && !ignoreError) {
        throw new EthContainerError(`[x] [in-docker-container error] ${stdout.split('\r\n').filter(x => x.match(/error/i) || stdout)}`, stdout)
      }
      return { statusCode: dockerRunResult[0].StatusCode, stdout: stdout.toString() }
    } catch (e: any) {
      if (e instanceof EthContainerError) { throw e }
      throw new DockerError(`[x] command [docker run]:${e.message}`)
    }
  }

  public createContainerAndRun = async (payload: DockerRunCommandType) => {
    await this.checkAndCreateNetwork(payload.network)
    const { image, tag, commands } = payload
    const createOptions: DockerCreateOptionsType = payload.createOptions || {
      Env: (payload.envFile ? fs.readFileSync(payload.envFile, { encoding: 'utf8' }).toString().split(/\n|\r|\r\n/).filter((x) => /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.test(x)) : []).concat(payload.env || []),
      HostConfig: {
        AutoRemove: payload.autoRemove !== undefined ? payload.autoRemove : true,
        NetworkMode: payload.network,
        Binds: payload.volumes,
      },
      User: (payload.user !== false) ? `${config.UID}:${config.GID}` : '',
    }
    const stdout = `docker command: \ndocker run -d -u ${config.UID}:${config.GID} ${createOptions.HostConfig?.NetworkMode ? `--network ${createOptions.HostConfig?.NetworkMode} ` : ''}${(createOptions.HostConfig?.Binds || []).map(x => `-v ${x} `).join('')}${(createOptions.Env || []).map(x => `--env ${x} `).join('')}${image}:${tag || 'latest'} ${commands.join(' ')}`
    logger.debug(stdout)
    const dockerContainer = await this.dockerode.createContainer({
      name: payload.name,
      Image: `${image}:${tag || 'latest'}`,
      Cmd: commands,
      ...createOptions,
      AttachStderr: true,
      AttachStdin: false,
      AttachStdout: true,
      OpenStdin: false,
      StdinOnce: false,
    })
    try {
      await dockerContainer.start()
      return { stdout: stdout }
    } catch (e: any) {
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
  private runSpawn (args: Array<string>): Promise<string> {
    return new Promise((resolve) => {
      logger.debug(`run spawnSync: docker compose ${args.join(' ')}`)
      const spawnReturn = spawn('docker', ['compose', ...args], { env: { ...process.env, UID: `${config.UID}`, GID: `${config.GID}` }, stdio: 'ignore' })
      // TODO ! docker 裡面的 error 不這樣抓
      // TODO 如果 docker-compose 不存在不會報錯
      spawnReturn.on('error', (error) => {
        throw new DockerError(`[x] command [docker compose]: ${error.message}`)
      })
      spawnReturn.on('exit', () => {
        resolve(`docker compose ${args.join(' ')} OK`)
      })
    })
  }

  public upInBackground = async (dockerComposeFile: string) => {
    const networks = (YAML.load(fs.readFileSync(dockerComposeFile).toString()) as DockerComposeYamlInterface).networks
    for (const network in networks) {
      if (networks[network]?.external) {
        await this.checkAndCreateNetwork(network)
      }
    }
    return { stdout: await this.runSpawn(['-f', dockerComposeFile, 'up', '-d']) }
  }

  public upServiceInBackground = async (dockerComposeFile: string, service: string) => {
    const networks = (YAML.load(fs.readFileSync(dockerComposeFile).toString()) as DockerComposeYamlInterface).networks
    for (const network in networks) {
      if (networks[network]?.external) {
        await this.checkAndCreateNetwork(network)
      }
    }
    return { stdout: await this.runSpawn(['-f', dockerComposeFile, 'up', '-d', '--', service]) }
  }

  public downAndRemoveVolumes = async (dockerComposeFile: string) => {
    return { stdout: await this.runSpawn(['-f', dockerComposeFile, 'down', '--volumes']) }
  }

  public downServiceAndRemoveVolumes = async (dockerComposeFile: string, service: string) => {
    return { stdout: await this.runSpawn(['-f', dockerComposeFile, 'down', '--volumes', '--', service]) }
  }

  public restart = async (dockerComposeFile: string, service: string[] = []) => {
    return { stdout: await this.runSpawn(['-f', dockerComposeFile, 'restart'].concat(service)) }
  }
}
