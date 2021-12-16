import { logger, ParamsError } from '../util'
import { NetworkCryptoConfigOrdererOrgType, NetworkCreateOrdererOrgType, NetworkOrdererPortType } from '../model/type/network.type'
import CryptoConfigYaml from '../model/yaml/network/cryptoConfigYaml'
import OrdererDockerComposeYaml from '../model/yaml/docker-compose/ordererDockerComposeYaml'
import OrdererInstance from '../instance/orderer'
import ConfigtxYaml from '../model/yaml/network/configtx'
import FabricTools from '../instance/fabricTools'
import Channel from './channel'
import { ChannelCreateChannelConfigComputeType, ChannelCreateChannelConfigSignType, ChannelCreateChannelConfigUpdateType } from '../model/type/channel.type'
import { OrdererAddType, ConsenterType, OrdererUpType, OrdererAddOrgToChannelType, OrdererAddConsenterToChannelType, OrdererApproveType, OrdererUpdateType } from '../model/type/orderer.type'
import { InfraRunnerResultType } from '../instance/infra/InfraRunner.interface'
import { OrgOrdererCreateType } from '../model/type/org.type'
import { AbstractService } from './Service.abstract'
import Org from './org'

export default class Orderer extends AbstractService {
  /**
   * @description 啟動 orderer org 的機器
   */
  public async up (dto: OrdererUpType): Promise<InfraRunnerResultType> {
    logger.debug(`Orderer up: ${dto.ordererHostname}`)
    return await new OrdererInstance(dto.ordererHostname, this.config, this.infra).up()
  }

  /**
   * @description 關閉 orderer org 的機器並且刪除其 volume 資料
   */
  public async down (dto: OrdererUpType): Promise<InfraRunnerResultType> {
    logger.debug(`Orderer down: ${dto.ordererHostname}`)
    return await new OrdererInstance(dto.ordererHostname, this.config, this.infra).down()
  }

  /**
   * @description 由 cryptogen 產生 orderer org 的憑證和私鑰
   * @returns 憑證和私鑰（~/.bdk/[blockchain network 名稱]/ordererOrganizations/[orderer org 的名稱] 資料夾底下）
   */
  public async cryptogen (dto: OrgOrdererCreateType) {
    const { ordererOrgs } = dto
    logger.debug('Orderer create cryptogen')

    const cryptoConfigYaml = new CryptoConfigYaml()
    const ordererOrgCryptoConfigYaml = this.createCryptoConfigYaml(ordererOrgs)

    if (ordererOrgCryptoConfigYaml && ordererOrgCryptoConfigYaml.value.OrdererOrgs) {
      cryptoConfigYaml.setOrdererOrgs(ordererOrgCryptoConfigYaml.value.OrdererOrgs)
    }

    this.bdkFile.createCryptoConfigYaml(cryptoConfigYaml)

    await (new FabricTools(this.config, this.infra)).cryptogenGenerateCryptoConfig()
  }

  /**
   * @description 由 orderer org 的 configtx.yaml 產生 orderer org 設定和 consenter 的 json 檔案
   * @returns orderer org 設定和 consenter 的 json 檔案（在 ~/.bdk/[blockchain network 名稱]/org-json）
   */
  public async createOrdererOrgConfigtxJSON (dto: OrgOrdererCreateType) {
    const { ordererOrgs } = dto
    const configtxYaml = new ConfigtxYaml()

    for (const ordererOrg of ordererOrgs) {
      logger.debug(`Orderer create configtx: ${ordererOrg.name}`)

      const ports = ordererOrg.ports?.map(port => port.port)

      const newOrg = configtxYaml.addOrdererOrg({
        name: ordererOrg.name,
        mspDir: `${this.config.infraConfig.dockerPath}/ordererOrganizations/${ordererOrg.domain}/msp`,
        domain: ordererOrg.domain,
        hostname: ordererOrg.hostname,
        ports,
      })
      this.bdkFile.createConfigtxOrdererOrg(newOrg)
      await (new Org(this.config, this.infra)).createOrgDefinitionJson(ordererOrg.name, configtxYaml)

      const ordererOrgConsenter: ConsenterType[] = []
      ordererOrg.hostname.forEach((hostname, index) => {
        const serverCertBase64 = this.bdkFile.getOrdererServerCertToBase64(hostname, ordererOrg.domain)

        ordererOrgConsenter.push({
          clientTlsCert: serverCertBase64,
          host: `${hostname}.${ordererOrg.domain}`,
          port: ports ? ports[index] : +`7${index}50`,
          serverTlsCert: serverCertBase64,
        })
      })
      this.bdkFile.createOrdererOrgConsenterJson(ordererOrg.name, JSON.stringify(ordererOrgConsenter))
    }
  }

  /**
   * @description 複製 TLS CA 到 blockchain network 底下指定的資料夾
   * @returns 複製 TLS CA 到 blockchain network 底下的資料夾 tlsca/[peer hostname 的名稱].[domain 的名稱]/ca.crt
   */
  public copyTLSCa (dto: OrgOrdererCreateType) {
    const { ordererOrgs } = dto
    ordererOrgs.forEach((ordererOrg: NetworkCreateOrdererOrgType) => {
      logger.debug(`Orderer create copyTLSCa: ${ordererOrg.name}`)
      for (const ordererHostname of ordererOrg.hostname) {
        this.bdkFile.copyOrdererOrgTLSCa(ordererHostname, ordererOrg.domain)
      }
    })
  }

  /**
   * @description 在 orderer org 新增一個 orderer
   * @returns  orderer org 的 docker compose yaml 檔案（在 ~/.bdk/[blockchain network 名稱]/docker-compose/[domain 的名稱]/docker-compose-orderer-[orderer 的 hostname].[orderer org 的名稱].yaml）
   */
  public add (dto: OrdererAddType) { // if port[i] is not undefine, use this port and publish a container's port to the host. else use default port.
    logger.debug('Orderer add')

    this.createOrdererOrgDockerComposeYaml(dto.orgName || this.config.orgName, dto.orgDomain || this.config.orgDomainName, dto.ordererHostnames, dto.genesisFileName, dto.ports)
  }

  /**
   * @description 產生多個 peer org 的 docker compose
   * @returns  peer org 的 docker compose yaml 檔案（在 ~/.bdk/[blockchain network 名稱]/docker-compose 底下）
   */
  public createDockerCompose (dto: OrgOrdererCreateType) {
    const { ordererOrgs, genesisFileName } = dto

    if (!genesisFileName) {
      throw new ParamsError('genesisFileName is required')
    }

    ordererOrgs.forEach((ordererOrg) => {
      logger.debug(`Orderer create docker-compose: ${ordererOrg.name}`)
      this.createOrdererOrgDockerComposeYaml(ordererOrg.name, ordererOrg.domain, ordererOrg.hostname, genesisFileName, ordererOrg.ports)
    })
  }

  /**
   * @description 產生 orderer org 的 docker compose
   * @param ordererName - orderer org 的名稱
   * @param ordererDomain - orderer org domain 的名稱
   * @param ordererHostnames - orderer 的 hostname 名稱
   * @param genesisFileName - 創始區塊的檔案名稱
   * @param ports - orderer org 中 port 設定
   * @returns orderer org 的 docker compose yaml 檔案（在 ~/.bdk/[blockchain network 名稱]/docker-compose/[domain 的名稱]/docker-compose-orderer-[orderer 的 hostname].[orderer org 的名稱].yaml）
   */
  public createOrdererOrgDockerComposeYaml (ordererName: string, ordererDomain: string, ordererHostnames: string[], genesisFileName: string, ports?: NetworkOrdererPortType[]) {
    ordererHostnames.forEach((hostname, i) => {
      const ordererDockerComposeYaml = new OrdererDockerComposeYaml()

      ordererDockerComposeYaml.addNetwork(this.config.networkName, { name: this.config.networkName, external: true })
      ordererDockerComposeYaml.addOrderer(this.config, ordererName, ordererDomain, hostname, genesisFileName, ports?.[i].port, ports?.[i].operationPort, ports?.[i].isPublishPort, ports?.[i].isPublishOperationPort)

      this.bdkFile.createDockerComposeYaml(`${hostname}.${ordererDomain}`, ordererDockerComposeYaml)

      ordererHostnames.forEach(hostname => {
        this.bdkFile.createOrgConfigEnv(`orderer-${hostname}.${ordererDomain}`, ordererDockerComposeYaml.getOrdererOrgEnv(this.config, ordererName, hostname, ordererDomain, ports?.[0]?.port))
      })
    })
  }

  /**
   * @description 產生 orderer org crypto config 所需的文字
   * @returns null ｜ orderer org crypto config 所需的文字
   */
  public createCryptoConfigYaml (cryptoConfigOrdererOrg: NetworkCryptoConfigOrdererOrgType[]) {
    const cryptConfigYaml = new CryptoConfigYaml()

    cryptoConfigOrdererOrg.forEach(x => cryptConfigYaml.addOrdererOrg({
      Name: x.name,
      Domain: x.domain,
      EnableNodeOUs: x.enableNodeOUs,
      Specs: x.hostname.map(y => ({ Hostname: y })),
    }))

    return cryptoConfigOrdererOrg.length === 0 ? null : cryptConfigYaml
  }

  /**
   * @description 將 orderer org 資訊加入到 channel 設定檔中
   */
  public async addOrgToChannel (dto: OrdererAddOrgToChannelType): Promise<void> {
    logger.debug(`Org Orderer Add Org: add ${dto.orgName} in ${dto.channelName}`)

    await this.addOrgToChannelSteps().fetchChannelConfig(dto)
    await this.addOrgToChannelSteps().orgConfigComputeUpdateConfigTx(dto)
  }

  /**
   * @ignore
   */
  public addOrgToChannelSteps () {
    return {
      fetchChannelConfig: async (dto: OrdererAddOrgToChannelType): Promise<InfraRunnerResultType> => {
        logger.debug('add org to channel step1 (fetchChannelConfig)')
        return await (new Channel(this.config, this.infra)).fetchChannelConfig(dto.channelName, this.config.orgType, dto.orderer)
      },
      orgConfigComputeUpdateConfigTx: async (dto: OrdererAddOrgToChannelType) => {
        logger.debug('add org to channel step2 (orgConfigComputeUpdateAndSignConfigTx)')
        const { channelName, orgName } = dto

        const configBlock = await (new Channel(this.config, this.infra)).getConfigBlock(channelName)
        this.bdkFile.createChannelConfigJson(channelName, Channel.channelConfigFileName(channelName).originalFileName, JSON.stringify(configBlock))

        const newOrg = JSON.parse(this.bdkFile.getOrgConfigJson(orgName))

        configBlock.channel_group.groups.Orderer.groups = {
          ...configBlock.channel_group.groups.Orderer.groups,
          [orgName]: newOrg,
        }

        this.bdkFile.createChannelConfigJson(channelName, Channel.channelConfigFileName(channelName).modifiedFileName, JSON.stringify(configBlock))
        const channelCreateChannelConfigUpdate: ChannelCreateChannelConfigComputeType = {
          channelName,
        }
        return await (new Channel(this.config, this.infra)).createChannelConfigSteps().computeUpdateConfigTx(channelCreateChannelConfigUpdate)
      },
    }
  }

  /**
   * @description 將 orderer consenter 資訊加入到 channel 設定檔中
   */
  public async addConsenterToChannel (dto: OrdererAddConsenterToChannelType): Promise<void> {
    logger.debug(`Org Orderer Add Consenter: add ${dto.hostname} of ${dto.orgName} in ${dto.channelName}`)

    await this.addConsenterToChannelSteps().fetchChannelConfig(dto)
    await this.addConsenterToChannelSteps().hostnameComputeUpdateConfigTx(dto)
  }

  /**
   * @ignore
   */
  public addConsenterToChannelSteps () {
    return {
      fetchChannelConfig: async (dto: OrdererAddConsenterToChannelType): Promise<InfraRunnerResultType> => {
        logger.debug('add consenter to channel step1 (fetchChannelConfig)')
        return await (new Channel(this.config, this.infra)).fetchChannelConfig(dto.channelName, this.config.orgType, dto.orderer)
      },
      hostnameComputeUpdateConfigTx: async (dto: OrdererAddConsenterToChannelType) => {
        logger.debug('add consenter to channel step2 (hostnameComputeUpdateAndSignConfigTx)')
        const { orderer, channelName } = dto
        const orgType = this.config.orgType

        const consenters = JSON.parse(this.bdkFile.getOrdererOrgConsenter(dto.orgName))
        const index = consenters.findIndex((x: ConsenterType) => x.host.split('.')[0] === dto.hostname)
        const consenter = consenters[index]

        const configBlock = await (new Channel(this.config, this.infra)).getConfigBlock(channelName)
        this.bdkFile.createChannelConfigJson(channelName, Channel.channelConfigFileName(channelName).originalFileName, JSON.stringify(configBlock))

        configBlock.channel_group.groups.Orderer.values.ConsensusType.value.metadata.consenters.push({
          clientTlsCert: consenter.clientTlsCert,
          host: consenter.host,
          port: consenter.port,
          serverTlsCert: consenter.serverTlsCert,
        })

        this.bdkFile.createChannelConfigJson(channelName, Channel.channelConfigFileName(channelName).modifiedFileName, JSON.stringify(configBlock))
        const channelCreateChannelConfigUpdate: ChannelCreateChannelConfigUpdateType = {
          signType: orgType,
          orderer,
          channelName,
        }
        return await (new Channel(this.config, this.infra)).createChannelConfigSteps().computeUpdateConfigTx(channelCreateChannelConfigUpdate)
      },
    }
  }

  public async approve (dto: OrdererApproveType): Promise<InfraRunnerResultType> {
    logger.debug(`Org Orderer Approve: ${this.config.orgName} sign ${dto.channelName} config update`)
    const { channelName } = dto

    const channelCreateChannelConfigUpdate: ChannelCreateChannelConfigSignType = {
      signType: this.config.orgType,
      channelName,
    }

    return await (new Channel(this.config, this.infra)).createChannelConfigSteps().signConfigTx(channelCreateChannelConfigUpdate)
  }

  public async update (dto: OrdererUpdateType): Promise<InfraRunnerResultType> {
    logger.debug(`Org Orderer update: ${this.config.orgName} update ${dto.channelName}`)
    const { orderer, channelName } = dto
    const orgType = this.config.orgType

    const channelCreateChannelConfigUpdate: ChannelCreateChannelConfigUpdateType = {
      signType: orgType,
      orderer,
      channelName,
    }
    return await (new Channel(this.config, this.infra)).createChannelConfigSteps().updateChannelConfig(channelCreateChannelConfigUpdate)
  }
}
