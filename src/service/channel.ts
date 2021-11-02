import { logger } from '../util/logger'
import { ConfigtxlatorEnum, ChannelCreateType, ChannelJoinType, ChannelUpdateAnchorPeerType, ChannelCreateChannelConfigUpdateType, ChannelFetchBlockType, ChannelConfigEnum, ChannelCreateChannelConfigSignType, ChannelCreateChannelConfigComputeType } from '../model/type/channel.type'
import { OrgTypeEnum } from '../config'
import ConfigtxYaml from '../model/yaml/network/configtx'
import FabricTools from '../instance/fabricTools'
import FabricInstance from '../instance/fabricInstance'
import { AbstractService, ParserType } from './Service.abstract'
import { DockerResultType, InfraRunnerResultType } from '../instance/infra/InfraRunner.interface'

interface ChannelParser extends ParserType {
  listJoinedChannel: (result: DockerResultType) => string[]
}
export default class Channel extends AbstractService {
  static readonly parser: ChannelParser = {
    listJoinedChannel: (result) => result.stdout.split('Channels peers has joined: \r\n')[1].split('\r\n').filter(x => x),
  }

  /**
   * @description 建立 channel
   */
  public async create (data: ChannelCreateType): Promise<void> {
    logger.info('[*] Channel create')
    await this.createSteps().createChannelArtifact(data)
    await this.createSteps().createOnInstance(data)
  }

  /**
   * @ignore
   */
  public createSteps () {
    return {
      createChannelArtifact: async (data: ChannelCreateType) => {
        this.generateChannelConfigtxYaml(data)
        await (new FabricTools(this.config, this.infra)).convertChannelConfigtxToTx(data.channelName)
        this.bdkFile.createChannelArtifact(data.channelName)
      },
      createOnInstance: async (data: ChannelCreateType): Promise<InfraRunnerResultType> => {
        return await (new FabricInstance(this.config, this.infra)).createChannel(data.channelName, data.orderer)
      },
    }
  }

  /**
   * @description 加入 channel
   */
  public async join (data: ChannelJoinType): Promise<void> {
    logger.info('[*] Channel join step 1')
    await this.joinSteps().fetchChannelBlock(data)
    logger.info('[*] Channel join step 2')
    await this.joinSteps().joinOnInstance(data)
  }

  /**
   * @ignore
   */
  public joinSteps () {
    return {
      fetchChannelBlock: async (data: ChannelJoinType): Promise<InfraRunnerResultType> => {
        return await this.fetchChannelBlock({ orderer: data.orderer, outputFileName: data.channelName, channelName: data.channelName, orgType: OrgTypeEnum.PEER, configType: ChannelConfigEnum.GENESIS_BLOCK })
      },
      joinOnInstance: async (data: ChannelJoinType): Promise<InfraRunnerResultType> => {
        return await (new FabricInstance(this.config, this.infra)).joinChannel(data.channelName)
      },
    }
  }

  /**
   * @description 更新 channel 設定檔上 peer org 的 anchor peer
   */
  public async updateAnchorPeer (data: ChannelUpdateAnchorPeerType): Promise<InfraRunnerResultType> {
    logger.info('[*] Channel update anchor peer')
    await this.updateAnchorPeerSteps().fetchChannelBlock(data)
    await this.updateAnchorPeerSteps().computeUpdateConfigTx(data)
    await this.updateAnchorPeerSteps().signConfigTx(data)
    return this.updateAnchorPeerSteps().updateChannelConfig(data)
  }

  /**
   * @ignore
   */
  public updateAnchorPeerSteps () {
    return {
      fetchChannelBlock: async (dto: ChannelUpdateAnchorPeerType): Promise<InfraRunnerResultType> => {
        const { channelName } = dto
        const signType = this.config.orgType

        logger.info(`[*] Channel Update Anchor Peer: fetch ${ChannelConfigEnum.CONFIG_BLOCK} block in ${channelName}`)

        this.bdkFile.createChannelArtifact(channelName)
        return await this.fetchChannelConfig(channelName, signType)
      },
      computeUpdateConfigTx: async (dto: ChannelUpdateAnchorPeerType) => {
        const { orderer, channelName, port } = dto
        const orgName = this.config.orgName
        const orgType = this.config.orgType
        const host = `${this.config.hostname}.${this.config.orgDomainName}`

        logger.info(`[*] Channel Update Anchor Peer: add ${host} anchor peer config in ${channelName} - compute update`)

        await this.decodeChannelConfig(channelName, Channel.channelConfigFileName(channelName).originalFileName, 'temp')

        const configBlock = JSON.parse(this.bdkFile.getChannelConfigString(channelName, 'temp')).data.data[0].payload.data.config

        this.bdkFile.createChannelConfigJson(channelName, Channel.channelConfigFileName(channelName).originalFileName, JSON.stringify(configBlock))

        configBlock.channel_group.groups.Application.groups[orgName].values.AnchorPeers = {
          mod_policy: 'Admin',
          value: {
            anchor_peers: [{
              host,
              port,
            }],
          },
          version: '0',
        }

        this.bdkFile.createChannelConfigJson(channelName, Channel.channelConfigFileName(channelName).modifiedFileName, JSON.stringify(configBlock))

        const channelCreateChannelConfigUpdate: ChannelCreateChannelConfigUpdateType = {
          signType: orgType,
          orderer,
          channelName,

        }

        await this.createChannelConfigSteps().computeUpdateConfigTx(channelCreateChannelConfigUpdate)
      },
      signConfigTx: async (dto: ChannelUpdateAnchorPeerType): Promise<InfraRunnerResultType> => {
        const { orderer, channelName } = dto
        const signType = this.config.orgType
        const host = `${this.config.hostname}.${this.config.orgDomainName}`

        logger.info(`[*] Channel Update Anchor Peer: add ${host} anchor peer config in ${channelName} - sign `)
        const channelCreateChannelConfigUpdate: ChannelCreateChannelConfigUpdateType = {
          signType,
          orderer,
          channelName,
        }

        return await this.createChannelConfigSteps().signConfigTx(channelCreateChannelConfigUpdate)
      },
      updateChannelConfig: async (data: ChannelUpdateAnchorPeerType): Promise<InfraRunnerResultType> => {
        const { orderer, channelName } = data

        logger.info(`[*] Channel Update Anchor Peer: update ${channelName} config`)
        const signType = this.config.orgType
        const channelCreateChannelConfigUpdate: ChannelCreateChannelConfigUpdateType = {
          signType,
          orderer,
          channelName,
        }
        return await this.createChannelConfigSteps().updateChannelConfig(channelCreateChannelConfigUpdate)
      },
    }
  }

  /**
   * @description
   */
  public async fetchChannelBlock (data: ChannelFetchBlockType): Promise<InfraRunnerResultType> {
    logger.info(`[*] Channel fetch block: fetch ${data.configType} block in ${data.channelName}`)
    switch (data.configType) {
      case ChannelConfigEnum.LATEST_BLOCK:
        return await this.fetchChannelBlockSteps().fetchChannelNewestBlock(data)

      case ChannelConfigEnum.GENESIS_BLOCK:
        return await this.fetchChannelBlockSteps().fetchChannelGenesisBlock(data)

      case ChannelConfigEnum.CONFIG_BLOCK:
        return await this.fetchChannelBlockSteps().fetchChannelConfig(data)
    }
  }

  /**
   * @ignore
   */
  public fetchChannelBlockSteps () {
    return {
      fetchChannelNewestBlock: async (data: ChannelFetchBlockType): Promise<InfraRunnerResultType> => {
        const { orderer, outputFileName, orgType, channelName } = data

        this.bdkFile.createChannelArtifact(channelName)
        return await (new FabricInstance(this.config, this.infra)).fetchChannelNewestBlock(orderer, channelName, outputFileName, orgType || this.config.orgType)
      },
      fetchChannelGenesisBlock: async (data: ChannelFetchBlockType): Promise<InfraRunnerResultType> => {
        const { orderer, outputFileName, channelName, orgType } = data

        this.bdkFile.createChannelArtifact(channelName)
        return await (new FabricInstance(this.config, this.infra)).fetchChannelBlock0(orderer, channelName, outputFileName, orgType || this.config.orgType)
      },
      fetchChannelConfig: async (data: ChannelFetchBlockType): Promise<InfraRunnerResultType> => {
        const { channelName, outputFileName, orgType } = data

        this.bdkFile.createChannelArtifact(channelName)
        return await (new FabricInstance(this.config, this.infra)).fetchChannelConfig(channelName, outputFileName, 'block', undefined, orgType || this.config.orgType)
      },
    }
  }

  /** @ignore */
  private generateChannelConfigtxYaml (configtxInput: ChannelCreateType) {
    logger.info('[*] Create configtx.yaml')

    const configtx = new ConfigtxYaml()
    configtx.importOrgs(this.bdkFile.getConfigtxOrgs())
    configtx.addApplicationChannelProfile({
      name: `${configtxInput.channelName}Channel`,
      consortium: 'AllOrganizationsConsortium',
      organizations: configtxInput.orgNames,
    })
    configtx.setApplicationChannelPolicy({
      profileName: `${configtxInput.channelName}Channel`,
      policyKey: 'Admins',
      policy: {
        Type: configtxInput.channelAdminPolicy.type,
        Rule: configtxInput.channelAdminPolicy.value,
      },
    })
    configtx.setApplicationChannelPolicy({
      profileName: `${configtxInput.channelName}Channel`,
      policyKey: 'LifecycleEndorsement',
      policy: {
        Type: configtxInput.lifecycleEndorsement.type,
        Rule: configtxInput.lifecycleEndorsement.value,
      },
    })
    configtx.setApplicationChannelPolicy({
      profileName: `${configtxInput.channelName}Channel`,
      policyKey: 'Endorsement',
      policy: {
        Type: configtxInput.endorsement.type,
        Rule: configtxInput.endorsement.value,
      },
    })

    this.bdkFile.createChannelConfigtx(configtxInput.channelName, configtx)
  }

  /**
   * @description 取得 channel 設定 peer org 的 anchor peer 和 orderer
   * @param channelName - channel 的名稱
   * @returns ```
   * anchorPeer - [string array] channel 中各個 peer org 的 anchor peer
   * orderer - [string array] channel 中的 orderer
   * ```
   */
  public async getChannelGroup (channelName: string): Promise<{ anchorPeer: string[]; orderer: string[] }> {
    await this.getChannelGroupSteps().fetchChannelConfig(channelName)
    return await this.getChannelGroupSteps().decodeFetchedChannelConfig(channelName)
  }

  /**
   * @ignore
   */
  public getChannelGroupSteps () {
    return {
      fetchChannelConfig: async (channelName: string): Promise<InfraRunnerResultType> => {
        logger.info(`[*] Get Channel Group step 1: ${channelName}`)
        return await (new FabricInstance(this.config, this.infra)).fetchChannelConfig(channelName, channelName, 'block', undefined, OrgTypeEnum.PEER)
      },
      decodeFetchedChannelConfig: async (channelName: string): Promise<{ anchorPeer: string[]; orderer: string[] }> => {
        logger.info(`[*] Get Channel Group step 2: ${channelName}`)
        await (new FabricTools(this.config, this.infra)).decodeChannelConfig(channelName)
        const channelConfigJson = this.bdkFile.getDecodedChannelConfig(channelName)
        const anchorPeer: string[] = []
        const groups = channelConfigJson.data.data[0].payload.data.config.channel_group.groups
        Object.values(groups.Application.groups).forEach((x: any) => x.values.AnchorPeers?.value.anchor_peers.forEach((y: any) => anchorPeer.push(`${y.host}:${y.port}`)))
        const orderer: string[] = []
        Object.values(groups.Orderer.groups).forEach((x: any) => x.values.Endpoints.value.addresses.forEach((y: any) => orderer.push(y)))
        return { anchorPeer, orderer }
      },
    }
  }

  /**
   * @description 由 config.yaml 建立 peer org 的 json 檔案
   * @param orgName - peer org 的名稱
   * @returns 在 blockchain network 資料夾底下 org-json/[peer org 名稱].json 檔案
   */
  // create new org configtx yaml
  public async createNewOrgConfigTx (orgName: string) {
    logger.info(`[*] Generate ${orgName} config json file: configtxgen ${this.config.infraConfig.bdkPath}/${this.config.networkName}/${orgName}/${orgName}.json`)

    const orgJson = (await (new FabricTools(this.config, this.infra)).createNewOrgConfigTx(orgName)).stdout.match(/{.*}/s)?.[0] || ''

    this.bdkFile.createOrgConfigJson(orgName, orgJson)
  }

  /**
   * fetch channel config to artifact/${channelName}/${channelName}_config_bock.pb
   */
  public async fetchChannelConfig (channelName: string, signType: OrgTypeEnum, orderer?: string): Promise<InfraRunnerResultType> {
    this.bdkFile.createChannelFolder(channelName)
    return await (new FabricInstance(this.config, this.infra)).fetchChannelConfig(channelName, Channel.channelConfigFileName(channelName).originalFileName, 'pb', orderer, signType)
  }

  /** @ignore */
  public async decodeChannelConfig (channelName: string, input: string, output: string) {
    await (new FabricTools(this.config, this.infra)).decodeProto(ConfigtxlatorEnum.BLOCK, channelName, input, output)
  }

  public static channelConfigFileName (channelName: string) {
    return {
      originalFileName: `${channelName}_config_block`,
      modifiedFileName: `${channelName}_modified_config_block`,
      compareUpdatedConfigFileName: `${channelName}_config_update`,
      envelopeFileName: `${channelName}_update_envelope`,
    }
  }

  /** @ignore */
  public createChannelConfigSteps () {
    return {
      computeUpdateConfigTx: async (data: ChannelCreateChannelConfigComputeType) => {
        const { channelName } = data
        const { originalFileName, modifiedFileName, compareUpdatedConfigFileName, envelopeFileName } = Channel.channelConfigFileName(channelName)
        await (new FabricTools(this.config, this.infra)).encodeProto(ConfigtxlatorEnum.CONFIG, channelName, originalFileName, originalFileName)
        await (new FabricTools(this.config, this.infra)).encodeProto(ConfigtxlatorEnum.CONFIG, channelName, modifiedFileName, modifiedFileName)

        await (new FabricTools(this.config, this.infra)).computeUpdateProto(channelName, originalFileName, modifiedFileName, compareUpdatedConfigFileName)

        await (new FabricTools(this.config, this.infra)).decodeProto(ConfigtxlatorEnum.CONFIG_UPDATE, channelName, compareUpdatedConfigFileName, compareUpdatedConfigFileName)

        const configUpdateJson = JSON.parse(this.bdkFile.getChannelConfigString(channelName, compareUpdatedConfigFileName))
        const envelope = {
          payload: {
            header: {
              channel_header: {
                channel_id: channelName,
                type: 2,
              },
            },
            data: {
              config_update: configUpdateJson,
            },
          },
        }

        this.bdkFile.createChannelConfigJson(channelName, envelopeFileName, JSON.stringify(envelope))

        await (new FabricTools(this.config, this.infra)).encodeProto(ConfigtxlatorEnum.ENVELOPE, channelName, envelopeFileName, envelopeFileName)
      },
      signConfigTx: async (data: ChannelCreateChannelConfigSignType): Promise<InfraRunnerResultType> => {
        const { signType, channelName } = data
        const { envelopeFileName } = Channel.channelConfigFileName(channelName)

        return await (new FabricInstance(this.config, this.infra)).signConfigTx(signType, channelName, envelopeFileName)
      },
      updateChannelConfig: async (data: ChannelCreateChannelConfigUpdateType): Promise<InfraRunnerResultType> => {
        const { signType, orderer, channelName } = data
        const { envelopeFileName } = Channel.channelConfigFileName(channelName)
        return await (new FabricInstance(this.config, this.infra)).updateChannelConfig(signType, orderer, channelName, envelopeFileName)
      },
    }
  }

  public listJoinedChannel = async (): Promise<InfraRunnerResultType> => {
    return await (new FabricInstance(this.config, this.infra)).listJoinedChannel()
  }
}
