import { logger } from '../../../../util/logger'
import { spawn } from 'child_process'
import config from '../../../config'
import { DockerResultType, KubernetesInfraRunner } from '../InfraRunner.interface'
import { ClusterDeleteType, K8SRunCommandType } from '../../../model/type/kubernetes.type'

export class Runner implements KubernetesInfraRunner<DockerResultType> {
  public createDeploymentAndService = async (payload: K8SRunCommandType): Promise<DockerResultType> => {
    await this.checkAndCreateNamespace(payload.namespace)
    const helmOutput = await this.runHelm(
      ['install',
        payload.name,
        payload.helmChart,
        '--namespace', payload.namespace,
        '--values', payload.values])
    return { stdout: helmOutput }
  }

  public createTemplate = async (payload: K8SRunCommandType): Promise<DockerResultType> => {
    const helmOutput = await this.runHelm(
      ['template',
        payload.name,
        payload.helmChart,
        '--namespace', payload.namespace,
        '--values', payload.values])
    return { stdout: helmOutput }
  }

  public wait = async (job: string, namespace: string, timeoutSecond = 300): Promise<DockerResultType> => {
    const k8sOutput = await this.runKubectl([
      'wait',
      '--for=condition=complete',
      job,
      '-n',
      namespace,
      `--timeout=${timeoutSecond.toString()}s`])
    return { stdout: k8sOutput }
  }

  public listAllRelease = async (namespace: string): Promise<DockerResultType> => {
    const helmOutput = await this.runHelm(['list', '--short', '--namespace', namespace])
    return { stdout: helmOutput }
  }

  public deleteDeploymentAndService = async (payload: ClusterDeleteType): Promise<DockerResultType> => {
    await this.runHelm(
      ['uninstall',
        payload.name,
        '--namespace', payload.namespace])
    return { stdout: '' }
  }

  public deleteAll = async (payload: K8SRunCommandType): Promise<DockerResultType> => {
    await this.runKubectl(['delete', 'all', '--all', '-n', payload.namespace])
    return { stdout: '' }
  }

  public chooseCluster = async (payload: K8SRunCommandType): Promise<DockerResultType> => {
    await console.log('chooseCluster')
    await this.runKubectl(['config', 'use-context', payload.name])
    return { stdout: '' }
  }

  public clusterList = async (): Promise<DockerResultType> => {
    await this.runKubectl(['config', 'get-contexts'])
    return { stdout: '' }
  }

  private async checkAndCreateNamespace (namespace: string): Promise<void> {
    try {
      await this.runKubectl(['get', 'namespaces', namespace])
    } catch (e: any) {
      if (e.message.includes('NotFound')) {
        await this.runKubectl(['create', 'namespace', namespace])
      }
    }
  }

  private checkInstall (name: string): Promise<string> {
    return new Promise((resolve) => {
      const spawnReturn = spawn('helm', ['list', '-n', name])
      spawnReturn.stdout.on('data', (data) => {
        resolve(data.toString())
      })
      spawnReturn.on('error', (error) => {
        throw new Error(`[x] command [helm]: ${error.message}`)
      })
    })
  }

  private runKubectl (args: Array<string>): Promise<string> {
    return new Promise((resolve, reject) => {
      logger.debug(`run spawnSync: kubectl ${args.join(' ')}`)
      const spawnReturn = spawn('kubectl', [...args], { env: { ...process.env, UID: `${config.UID}`, GID: `${config.GID}` } })
      let output = ''
      spawnReturn.stdout.on('data', (data) => {
        output += data
      })

      spawnReturn.stderr.on('data', (data) => {
        output += data
      })
      spawnReturn.stdout.on('close', () => {
        if (output.includes('Error')) reject(new Error(`[x] command [kubectl ${args.join(' ')}]: ${output}`))
        resolve(`kubectl ${args.join(' ')} ${output} OK`)
      })
      spawnReturn.on('error', (error) => {
        throw new Error(`[x] command [kubectl]: ${error.message}`)
      })
    })
  }

  private runHelm (args: Array<string>): Promise<string> {
    return new Promise((resolve, reject) => {
      logger.debug(`run spawnSync: helm ${args.join(' ')}`)
      const spawnReturn = spawn('helm', [...args], { env: { ...process.env, UID: `${config.UID}`, GID: `${config.GID}` } })
      let output = ''
      spawnReturn.stdout.on('data', (data) => {
        output += data
      })

      spawnReturn.stderr.on('data', (data) => {
        output += data
      })
      spawnReturn.stdout.on('close', () => {
        resolve(`helm ${args.join(' ')} OK\n${output}`)
        if (output.includes('Error')) reject(new Error(`[x] command [helm ${args.join(' ')}]: ${output}`))
      })
      spawnReturn.on('error', (error) => {
        throw new Error(`[x] command [helm]: ${error.message}`)
      })
    })
  }
}
