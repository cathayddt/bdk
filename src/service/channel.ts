import { diff, detailedDiff } from 'deep-object-diff'
import { logger } from '../util/logger'
import { OrgTypeEnum } from '../model/type/config.type'
import {
  ConfigtxlatorEnum,
  ChannelCreateType,
  ChannelJoinType,
  ChannelUpdateAnchorPeerType,
  ChannelFetchBlockType,
  ChannelConfigEnum,
  ChannelApproveType,
  ChannelUpdateType,
  DecodeEnvelopeType,
  DecodeEnvelopeReturnType,
  EnvelopeTypeEnum,
  EnvelopeVerifyEnum,
} from '../model/type/channel.type'
import ConfigtxYaml from '../model/yaml/network/configtx'
import FabricTools from '../instance/fabricTools'
import FabricInstance from '../instance/fabricInstance'
import { AbstractService, ParserType } from './Service.abstract'
import { DockerResultType, InfraRunnerResultType } from '../instance/infra/InfraRunner.interface'
import { ProcessError } from '../util'

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
    logger.debug('Channel create')
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
        this.bdkFile.createChannelArtifactFolder(data.channelName)
        await (new FabricTools(this.config, this.infra)).convertChannelConfigtxToTx(data.channelName)
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
    logger.debug('Channel join step 1')
    await this.joinSteps().fetchChannelBlock(data)
    logger.debug('Channel join step 2')
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
    logger.debug('Channel update anchor peer')
    await this.updateAnchorPeerSteps().fetchChannelConfig(data)
    await this.updateAnchorPeerSteps().computeUpdateConfigTx(data)
    await this.updateAnchorPeerSteps().signConfigTx(data)
    return this.updateAnchorPeerSteps().updateChannelConfig(data)
  }

  /**
   * @ignore
   */
  public updateAnchorPeerSteps () {
    return {
      fetchChannelConfig: async (dto: ChannelUpdateAnchorPeerType): Promise<InfraRunnerResultType> => {
        const { channelName } = dto

        logger.debug(`Channel Update Anchor Peer: fetch ${ChannelConfigEnum.CONFIG_BLOCK} block in ${channelName}`)

        this.bdkFile.createChannelArtifactFolder(channelName)
        return await this.fetchChannelConfig(channelName)
      },
      computeUpdateConfigTx: async (dto: ChannelUpdateAnchorPeerType) => {
        const { channelName, port } = dto
        const orgName = this.config.orgName
        const host = `${this.config.hostname}.${this.config.orgDomainName}`

        logger.debug(`Channel Update Anchor Peer: add ${host} anchor peer config in ${channelName} - compute update`)

        const updateFunction = (configBlock: any) => {
          const modifiedConfigBlock = JSON.parse(JSON.stringify(configBlock))
          modifiedConfigBlock.channel_group.groups.Application.groups[orgName].values.AnchorPeers = {
            mod_policy: 'Admin',
            value: {
              anchor_peers: [{
                host,
                port,
              }],
            },
            version: '0',
          }
          return modifiedConfigBlock
        }

        await this.computeUpdateConfigTx(channelName, updateFunction)
      },
      signConfigTx: async (dto: ChannelUpdateAnchorPeerType): Promise<InfraRunnerResultType> => {
        const { channelName } = dto
        const host = `${this.config.hostname}.${this.config.orgDomainName}`

        logger.debug(`Channel Update Anchor Peer: add ${host} anchor peer config in ${channelName} - sign `)
        const channelCreateChannelConfigUpdate: ChannelApproveType = {
          channelName,
        }

        return await this.approve(channelCreateChannelConfigUpdate)
      },
      updateChannelConfig: async (data: ChannelUpdateAnchorPeerType): Promise<InfraRunnerResultType> => {
        const { orderer, channelName } = data

        logger.debug(`Channel Update Anchor Peer: update ${channelName} config`)
        const channelCreateChannelConfigUpdate: ChannelUpdateType = {
          orderer,
          channelName,
        }
        return await this.update(channelCreateChannelConfigUpdate)
      },
    }
  }

  /**
   * @description
   */
  public async fetchChannelBlock (data: ChannelFetchBlockType): Promise<InfraRunnerResultType> {
    logger.debug(`Channel fetch block: fetch ${data.configType} block in ${data.channelName}`)
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

        this.bdkFile.createChannelArtifactFolder(channelName)
        return await (new FabricInstance(this.config, this.infra)).fetchChannelNewestBlock(channelName, outputFileName, 'block', orderer, orgType || this.config.orgType)
      },
      fetchChannelGenesisBlock: async (data: ChannelFetchBlockType): Promise<InfraRunnerResultType> => {
        const { orderer, outputFileName, channelName, orgType } = data

        this.bdkFile.createChannelArtifactFolder(channelName)
        return await (new FabricInstance(this.config, this.infra)).fetchChannelBlock0(channelName, outputFileName, 'block', orderer, orgType || this.config.orgType)
      },
      fetchChannelConfig: async (data: ChannelFetchBlockType): Promise<InfraRunnerResultType> => {
        const { orderer, channelName, outputFileName, orgType } = data

        this.bdkFile.createChannelArtifactFolder(channelName)
        return await (new FabricInstance(this.config, this.infra)).fetchChannelConfig(channelName, outputFileName, 'block', orderer, orgType || this.config.orgType)
      },
    }
  }

  /** @ignore */
  private generateChannelConfigtxYaml (configtxInput: ChannelCreateType) {
    logger.debug('Create configtx.yaml')

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
        logger.debug(`Get Channel Group step 1: ${channelName}`)
        return await (new FabricInstance(this.config, this.infra)).fetchChannelConfig(channelName, channelName, 'block', undefined, OrgTypeEnum.PEER)
      },
      decodeFetchedChannelConfig: async (channelName: string): Promise<{ anchorPeer: string[]; orderer: string[] }> => {
        logger.debug(`Get Channel Group step 2: ${channelName}`)
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
   * fetch channel config to artifact/${channelName}/${channelName}_config_bock.pb
   */
  public async fetchChannelConfig (channelName: string, orderer?: string, signType: OrgTypeEnum = this.config.orgType): Promise<InfraRunnerResultType> {
    this.bdkFile.createChannelFolder(channelName)
    return await (new FabricInstance(this.config, this.infra)).fetchChannelConfig(channelName, Channel.channelConfigFileName(channelName).fetchFileName, 'pb', orderer, signType)
  }

  /** @ignore */
  private async decodeChannelConfig (channelName: string, input: string, output: string) {
    await (new FabricTools(this.config, this.infra)).decodeProto(ConfigtxlatorEnum.BLOCK, channelName, input, output)
  }

  /** @ignore */
  public async getConfigBlock (channelName: string) {
    await this.decodeChannelConfig(channelName, Channel.channelConfigFileName(channelName).fetchFileName, 'temp')
    return JSON.parse(this.bdkFile.getChannelConfigString(channelName, 'temp')).data.data[0].payload.data.config
  }

  public static channelConfigFileName (channelName: string) {
    return {
      fetchFileName: `${channelName}_fetch`,
      originalFileName: `${channelName}_config_block`,
      modifiedFileName: `${channelName}_modified_config_block`,
      compareUpdatedConfigFileName: `${channelName}_config_update`,
      envelopeFileName: `${channelName}_update_envelope`,
    }
  }

  /** @ignore */
  public async computeUpdateConfigTx (channelName: string, updateFunction: (oldConfig: any) => any) {
    const { originalFileName, modifiedFileName, compareUpdatedConfigFileName, envelopeFileName } = Channel.channelConfigFileName(channelName)
    const configBlock = await (new Channel(this.config, this.infra)).getConfigBlock(channelName)
    this.bdkFile.createChannelConfigJson(channelName, originalFileName, JSON.stringify(configBlock))
    const modifiedConfigBlock = updateFunction(configBlock)
    this.bdkFile.createChannelConfigJson(channelName, Channel.channelConfigFileName(channelName).modifiedFileName, JSON.stringify(modifiedConfigBlock))
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
  }

  /**
   * @description 簽署信封
   */
  public async approve (data: ChannelApproveType): Promise<InfraRunnerResultType> {
    const { channelName } = data
    const { envelopeFileName } = Channel.channelConfigFileName(channelName)

    return await (new FabricInstance(this.config, this.infra)).signConfigTx(this.config.orgType, channelName, envelopeFileName)
  }

  /**
   * @description 將信封的更動更新到鏈上
   */
  public async update (data: ChannelUpdateType): Promise<InfraRunnerResultType> {
    const { orderer, channelName } = data
    const { envelopeFileName } = Channel.channelConfigFileName(channelName)
    return await (new FabricInstance(this.config, this.infra)).updateChannelConfig(this.config.orgType, orderer, channelName, envelopeFileName)
  }

  /**
   * @description 解析信封
   */
  public decodeEnvelope = async (data: DecodeEnvelopeType): Promise<DecodeEnvelopeReturnType> => {
    const { channelName } = data
    const { envelopeFileName } = Channel.channelConfigFileName(channelName)
    await (new FabricTools(this.config, this.infra)).decodeProto(ConfigtxlatorEnum.ENVELOPE, channelName, envelopeFileName, envelopeFileName)

    const envelope = JSON.parse(this.bdkFile.getChannelJson(channelName, envelopeFileName))
    const approved = envelope.payload.data.signatures.map((signature: any) => signature.signature_header.creator.mspid)
    const rwsetDiff: any = detailedDiff(envelope.payload.data.config_update.read_set, envelope.payload.data.config_update.write_set)

    const verifyOrg = (org: string, value: any): EnvelopeVerifyEnum => {
      let orgDefinition
      try {
        orgDefinition = JSON.parse(this.bdkFile.getOrgConfigJson(org))
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          return EnvelopeVerifyEnum.NO_FILE
        }
        throw e
      }
      if (Object.entries(diff(value as object, orgDefinition)).length === 0) {
        return EnvelopeVerifyEnum.VERIFIED
      } else {
        return EnvelopeVerifyEnum.NOT_MATCH
      }
    }

    if (Object.keys(rwsetDiff.added?.groups?.Application?.groups || {}).length === 1) {
      const [org, value] = Object.entries(rwsetDiff.added?.groups?.Application?.groups)[0]
      if (rwsetDiff.added?.groups?.Application?.groups?.[org]?.values?.AnchorPeers?.value?.anchor_peers?.length) {
        return {
          approved,
          type: EnvelopeTypeEnum.UPDATE_ANCHOR_PEER,
          org,
          anchorPeers: (value as any)?.values?.AnchorPeers?.value?.anchor_peers?.map((x: any) => `${x?.host}:${x?.port}`),
        }
      } else {
        return {
          approved,
          type: EnvelopeTypeEnum.ADD_PEER_TO_APPLICATION_CHANNEL,
          org,
          verify: verifyOrg(org, value),
        }
      }
    } else if (Object.keys(rwsetDiff.added?.groups?.Consortiums?.groups?.AllOrganizationsConsortium?.groups || {}).length === 1) {
      const [org, value] = Object.entries(rwsetDiff.added?.groups?.Consortiums?.groups?.AllOrganizationsConsortium?.groups)[0]
      return {
        approved,
        type: EnvelopeTypeEnum.ADD_PEER_TO_SYSTEM_CHANNEL,
        org,
        verify: verifyOrg(org, value),
      }
    } else if (Object.keys(rwsetDiff.added?.groups?.Orderer?.groups || {}).length === 1) {
      const [org, value] = Object.entries(rwsetDiff.added?.groups?.Orderer?.groups)[0]
      return {
        approved,
        type: EnvelopeTypeEnum.ADD_ORDERER_TO_CHANNEL,
        org,
        verify: verifyOrg(org, value),
      }
    } else if ((rwsetDiff.added?.groups?.Orderer?.values?.ConsensusType?.value?.metadata?.consenters || [])?.length > 0) {
      return {
        approved,
        type: EnvelopeTypeEnum.ADD_ORDERER_CONSENTER,
        consensus: rwsetDiff.added?.groups?.Orderer?.values?.ConsensusType?.value?.metadata?.consenters?.map((consenter: any) => (`${consenter?.host}:${consenter?.port}`)),
      }
    } else {
      throw new ProcessError('unknown envelope format')
    }
  }

  public listJoinedChannel = async (): Promise<InfraRunnerResultType> => {
    return await (new FabricInstance(this.config, this.infra)).listJoinedChannel()
  }
}
