import YAML from 'js-yaml'
import { logger } from '../../../../util/logger'
import { spawn } from 'child_process'
import config from '../../../config'
import fs from 'fs-extra'
import { DockerResultType, KubernetesInfraRunner } from '../InfraRunner.interface'
import { K8SRunCommandType } from '../../../model/type/kubernetes.type'

export class Runner implements KubernetesInfraRunner<DockerResultType> {
  public createDeploymentAndService = async (payload: K8SRunCommandType): Promise<DockerResultType> => {
    await console.log('createDeploymentAndService')
    await this.checkAndCreateNamespace(payload.namespace)
    await this.runHelm(
      ['install',
        payload.name,
        payload.helmChart,
        '--namespace', payload.namespace,
        '--values', payload.values])
    return { stdout: '' }
  }

  public createTemplate = async (payload: K8SRunCommandType): Promise<DockerResultType> => {
    await console.log('createTemplate')
    await this.runHelm(
      ['template',
        payload.name,
        payload.helmChart,
        '--namespace', payload.namespace,
        '--values', payload.values])
    return { stdout: '' }
  }

  public deleteDeploymentAndService = async (payload: K8SRunCommandType): Promise<DockerResultType> => {
    await console.log('deleteDeploymentAndService')
    await this.runHelm(
      ['delete',
        payload.name,
        '--namespace', payload.namespace])
    return { stdout: '' }
  }

  public deleteAll = async (payload: K8SRunCommandType): Promise<DockerResultType> => {
    await console.log('deleteAll')
    await this.runKubectl(['delete', 'all', '--all', '-n', payload.namespace])
    return { stdout: '' }
  }

  public chooseCluster = async (payload: K8SRunCommandType): Promise<DockerResultType> => {
    await console.log('chooseCluster')
    await this.runKubectl(['config', 'use-context', payload.name])
    return { stdout: '' }
  }

  public clusterList = async (): Promise<DockerResultType> => {
    await console.log('clusterList')
    await this.runKubectl(['config', 'get-contexts'])
    return { stdout: '' }
  }

  private getYaml (path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) reject(err)
        resolve(YAML.load(data))
      })
    })
  }

  private async checkAndCreateNamespace (namespace: string): Promise<void> {
    try {
      console.log(`kubectl get namespaces ${namespace}`)
      await this.runKubectl(['get', 'namespaces', namespace])
    } catch (e: any) {
      if (e.message.includes('NotFound')) {
        console.log('create namespace')
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
      console.log(`run spawnSync: helm ${args.join(' ')}`)
      const spawnReturn = spawn('helm', [...args], { env: { ...process.env, UID: `${config.UID}`, GID: `${config.GID}` } })
      let output = ''
      spawnReturn.stdout.on('data', (data) => {
        output += data
      })

      spawnReturn.stderr.on('data', (data) => {
        output += data
      })
      spawnReturn.stdout.on('close', () => {
        console.log(`helm ${args.join(' ')} OK\n${output}`)
        resolve(`helm ${args.join(' ')} OK\n${output}`)
      })
      spawnReturn.on('error', (error) => {
        throw new Error(`[x] command [helm]: ${error.message}`)
      })
    })
  }
}
