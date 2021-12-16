import {
  CaUpType,
  CaRegisterType,
  CaEnrollType,
  CaEnrollTypeEnum,
  CaDownType,
  CaEnrollCommandTypeEnum,
} from '../model/type/caService.type'
import CaInstance from '../instance/ca'
import FabricCa from '../instance/fabricCaClient'
import CaDockerComposeYaml from '../model/yaml/docker-compose/caComposeYaml'
import { InfraRunnerResultType } from '../instance/infra/InfraRunner.interface'
import { logger } from '../util'
import { AbstractService } from './Service.abstract'

export default class Ca extends AbstractService {
  /**
   * @description 啟動 CA 機器
   */
  public async up (arg: CaUpType): Promise<InfraRunnerResultType> {
    const caConfig = new CaDockerComposeYaml()

    // TODO: change admin pwd
    caConfig.addCa(
      this.config,
      arg.basic,
      arg.crypto,
      arg.signing,
      arg.upstreamEnabled,
      arg.csr,
      arg.intermediate,
    )
    caConfig.addNetwork(this.config.networkName, { name: this.config.networkName, external: true })
    caConfig.addVolume(arg.basic.caName, {})

    this.bdkFile.createDockerComposeYaml(arg.basic.caName, caConfig)
    this.bdkFile.createCaFolder()

    return await (new CaInstance(arg.basic.caName, this.config, this.infra)).up()
  }

  /**
   * @description 關閉 CA 機器
   * @param caName - CA 機器的名稱
   */
  public async down (arg: CaDownType): Promise<InfraRunnerResultType> {
    return await (new CaInstance(arg.caName, this.config, this.infra)).down()
  }

  /**
   * @description 取得 CA 機器的憑證
   */
  public async enroll (arg: CaEnrollType) {
    await this.enrollSteps().enrollMsp(arg)
    if (arg.type === CaEnrollCommandTypeEnum.orderer || arg.type === CaEnrollCommandTypeEnum.peer) {
      await this.enrollSteps().enrollTls(arg)
    }
    this.enrollSteps().format(arg)
  }

  /**
   * @ignore
   */
  public enrollSteps () {
    return {
      enrollMsp: async (arg: CaEnrollType): Promise<InfraRunnerResultType> => {
        logger.debug('enroll step 1 (msp)')
        if (arg.type === CaEnrollCommandTypeEnum.orderer) {
          return await (new FabricCa(this.config, this.infra)).enroll(
            CaEnrollTypeEnum.msp,
            arg.clientId,
            arg.clientSecret,
            arg.upstream,
            arg.upstreamPort,
          )
        } else if (arg.type === CaEnrollCommandTypeEnum.peer) {
          return await (new FabricCa(this.config, this.infra)).enroll(
            CaEnrollTypeEnum.msp,
            arg.clientId,
            arg.clientSecret,
            arg.upstream,
            arg.upstreamPort,
          )
        } else if (arg.type === CaEnrollCommandTypeEnum.client) {
          return await (new FabricCa(this.config, this.infra)).enroll(
            CaEnrollTypeEnum.client,
            arg.clientId,
            arg.clientSecret,
            arg.upstream,
            arg.upstreamPort,
          )
        } else if (arg.type === CaEnrollCommandTypeEnum.user) {
          return await (new FabricCa(this.config, this.infra)).enroll(
            CaEnrollTypeEnum.user,
            arg.clientId,
            arg.clientSecret,
            arg.upstream,
            arg.upstreamPort,
          )
        } else {
          throw new Error('Type should be orderer, peer, client or user')
        }
      },
      enrollTls: async (arg: CaEnrollType): Promise<InfraRunnerResultType> => {
        logger.debug('enroll step 2 (tls)')
        if (arg.type === CaEnrollCommandTypeEnum.orderer) {
          return await (new FabricCa(this.config, this.infra)).enroll(
            CaEnrollTypeEnum.tls,
            arg.clientId,
            arg.clientSecret,
            arg.upstream,
            arg.upstreamPort,
          )
        } else if (arg.type === CaEnrollCommandTypeEnum.peer) {
          return await (new FabricCa(this.config, this.infra)).enroll(
            CaEnrollTypeEnum.tls,
            arg.clientId,
            arg.clientSecret,
            arg.upstream,
            arg.upstreamPort,
          )
        } else {
          throw new Error('Type should be orderer or peer')
        }
      },
      format: (arg: CaEnrollType) => {
        logger.debug('enroll step 3 (format)')
        if (arg.type === CaEnrollCommandTypeEnum.orderer) {
          this.bdkFile.caFormatOrderer(arg.upstream, arg.clientId, arg.orgHostname)
        } else if (arg.type === CaEnrollCommandTypeEnum.peer) {
          this.bdkFile.caFormatPeer(arg.upstream, arg.clientId, arg.orgHostname)
        } else if (arg.type === CaEnrollCommandTypeEnum.client) {
          if (arg.role === 'orderer' || arg.role === 'peer') {
            this.bdkFile.caFormatOrg(arg.upstream, arg.clientId, arg.role, arg.orgHostname)
          }
        } else if (arg.type === CaEnrollCommandTypeEnum.user) {
          if (arg.role === 'orderer' || arg.role === 'peer') {
            this.bdkFile.caFormatUser(arg.upstream, arg.clientId, arg.role, arg.orgHostname)
          }
        }
      },
    }
  }

  /**
   * @description 註冊 CA
   */
  public async register (arg: CaRegisterType): Promise<InfraRunnerResultType> {
    return await (new FabricCa(this.config, this.infra)).register(
      arg.type,
      arg.clientId,
      arg.clientSecret,
      arg.upstream,
      arg.upstreamPort,
      arg.admin,
    )
  }
}
