import { CaEnrollTypeEnum, CaRegisterTypeEnum } from '../model/type/caService.type'
import { InfraRunnerResultType } from './infra/InfraRunner.interface'
import { AbstractInstance } from './Instance.abstract'

interface OptionsType {
  tag?: string
  volumes?: string[]
  network?: string
}

export default class FabricCa extends AbstractInstance {
  private async infraRunCommand (
    commands: string[],
    env?: string[],
    volumes?: string[],
    options?: OptionsType,
  ) {
    return await this.infra.runCommand({
      image: 'hyperledger/fabric-ca',
      tag: options?.tag || this.config.fabricVersion.ca,
      network: options?.network || this.config.networkName,
      volumes: options?.volumes || [`${this.hostPath}/${this.config.networkName}:${this.dockerPath}`].concat(volumes || []),
      env: env,
      commands: commands,
    })
  }

  public async enroll (
    type: CaEnrollTypeEnum,
    clientId: string,
    clientSecret: string,
    upstream: string,
    upstreamPort: number,
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'fabric-ca-client',
        'enroll',
        '-d',
        '-u',
        `https://${clientId}:${clientSecret}@${upstream}:${upstreamPort}`,
        '--tls.certfiles',
        `${this.dockerPath}/ca/${upstream}/crypto/tls-cert.pem`,
        '--home',
        `${this.dockerPath}/ca/${clientId}@${upstream}`,
      ]
        .concat(type === CaEnrollTypeEnum.client ? [] : ['--mspdir', type])
        .concat(type === CaEnrollTypeEnum.tls ? ['--enrollment.profile', 'tls', '--csr.hosts', clientId] : []),
      undefined,
      undefined,
      options)
  }

  public async register (
    type: CaRegisterTypeEnum,
    clientId: string,
    clientSecret: string,
    upstream: string,
    upstreamPort: number,
    adminName: string,
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'fabric-ca-client',
        'register',
        '-d',
        '-u',
        `https://${clientId}:${clientSecret}@${upstream}:${upstreamPort}`,
        '--tls.certfiles',
        `${this.dockerPath}/ca/${upstream}/crypto/tls-cert.pem`,
        '--home',
        `${this.dockerPath}/ca/${adminName}@${upstream}`,
        '--id.name',
        clientId,
        '--id.secret',
        clientSecret,
      ]
        .concat(type === CaRegisterTypeEnum.ica ? ['--id.attrs', '"hf.Registrar.Roles=user,peer",hf.IntermediateCA=true'] : ['--id.type', type]),
      undefined,
      undefined,
      options)
  }
}
