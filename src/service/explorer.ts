import { logger } from '../util/logger'
import { ExplorerChannelType, ExplorerUpdateForMyOrgStepRestartType, ExplorerUpForMyOrgStepUpType, ExplorerUpForMyOrgType } from '../model/type/explorer.type'
import ExplorerConnectionProfileYaml from '../model/yaml/explorer/explorerConnectionProfileYaml'
import ExplorerConfigYaml from '../model/yaml/explorer/explorerConfigYaml'
import Channel from './channel'
import ExplorerInstance from '../instance/explorer'
import { DockerResultType, InfraRunnerResultType } from '../instance/infra/InfraRunner.interface'
import { AbstractService, ParserType } from './Service.abstract'
import ExplorerDockerComposeYaml from '../model/yaml/docker-compose/explorerDockerComposeYaml'

interface ExplorerParser extends ParserType {
  listJoinedChannel: (result: DockerResultType, options: {hostname: string}) => ExplorerChannelType
}

// TODO refactor
export default class Explorer extends AbstractService {
  static readonly parser: ExplorerParser = {
    listJoinedChannel: (result, options) => {
      const joinedChannel = Channel.parser.listJoinedChannel(result)
      const channels: ExplorerChannelType = {}
      joinedChannel.forEach(channel => {
        channels[channel] = { hostname: options.hostname }
      })
      return channels
    },
  }

  /** @ignore */
  private createExplorerConfig (data: ExplorerUpForMyOrgStepUpType | ExplorerUpdateForMyOrgStepRestartType) {
    logger.debug(`Create file: ${this.config.networkName}.json`)
    const explorerConnectionProfileYaml = new ExplorerConnectionProfileYaml()
    explorerConnectionProfileYaml.setName(this.config.networkName)
    explorerConnectionProfileYaml.loadFromPeerConnectionProfile(this.bdkFile.getConnectionFile(this.config.orgName, this.config.orgDomainName))
    explorerConnectionProfileYaml.setOrgKey(
      this.config.orgName,
      this.bdkFile.getAdminPrivateKeyPem(this.config.orgDomainName),
      this.bdkFile.getAdminSignCert(this.config.orgDomainName),
    )
    if ('user' in data && 'pass' in data) {
      explorerConnectionProfileYaml.setAdminCredential(data.user, data.pass)
    }
    if (data.channels) {
      Object.keys(data.channels).forEach(channel => {
        explorerConnectionProfileYaml.addChannel(
          channel,
          [`${data.channels?.[channel].hostname}.${this.config.orgDomainName}`],
        )
      })
    }
    explorerConnectionProfileYaml.setClientOrganization(this.config.orgName)
    this.bdkFile.createExplorerConnectionProfile(this.config.networkName, explorerConnectionProfileYaml)

    logger.debug(`Blockchain Explorer create network ${this.config.networkName} config`)
    const explorerConfigYaml = new ExplorerConfigYaml()
    explorerConfigYaml.addNetwork(this.config.networkName)

    logger.debug('Create file: config.json')
    this.bdkFile.createExplorerConfig(explorerConfigYaml)
  }

  /**
   * @description 關閉 explorer
   */
  public async down (): Promise<InfraRunnerResultType> {
    logger.debug('Explorer down')
    return await (new ExplorerInstance(this.config, this.infra)).down()
  }

  /**
   * @description 啟動 peer org 的 explorer
   */
  public async upForMyOrg (data: ExplorerUpForMyOrgType): Promise<void> {
    const listJoinedChannelResult = await this.upForMyOrgSteps().listJoinedChannel()
    if (!('stdout' in listJoinedChannelResult)) {
      logger.error('this service only for docker infra')
      throw new Error('this service for docker infra')
    }
    const channels = Explorer.parser.listJoinedChannel(listJoinedChannelResult, { hostname: this.config.hostname })
    await this.upForMyOrgSteps().up({ ...data, channels })
  }

  /**
   * @ignore
   */
  public upForMyOrgSteps () {
    return {
      listJoinedChannel: async (): Promise<InfraRunnerResultType> => {
        logger.debug('up explorer for my org step 1 (fetch joined channel)')
        return await (new Channel(this.config)).listJoinedChannel()
      },
      up: async (payload: ExplorerUpForMyOrgStepUpType): Promise<InfraRunnerResultType> => {
        logger.debug('up explorer for my org step 2 (start explorer)')
        this.createExplorerConfig(payload)
        const dockerComposeYaml = new ExplorerDockerComposeYaml(this.config, payload.port)
        this.bdkFile.createExplorerDockerComposeYaml(dockerComposeYaml)
        logger.debug('Starting explorer container')
        return await (new ExplorerInstance(this.config, this.infra)).up()
      },
    }
  }

  /**
   * @description 更新 explorer 的 peer org
   */
  public async updateForMyOrg (): Promise<void> {
    const listJoinedChannelResult = await this.updateForMyOrgSteps().listJoinedChannel()
    if (!('stdout' in listJoinedChannelResult)) {
      logger.error('this service only for docker infra')
      throw new Error('this service for docker infra')
    }
    const channels = Explorer.parser.listJoinedChannel(listJoinedChannelResult, { hostname: this.config.hostname })
    await this.updateForMyOrgSteps().restart({ channels })
  }

  /**
   * @ignore
   */
  public updateForMyOrgSteps () {
    return {
      listJoinedChannel: async (): Promise<InfraRunnerResultType> => {
        logger.debug('update explorer for my org step 1 (fetch joined channel)')
        return await (new Channel(this.config, this.infra)).listJoinedChannel()
      },
      restart: async (payload: ExplorerUpdateForMyOrgStepRestartType): Promise<InfraRunnerResultType> => {
        logger.debug('update explorer for my org step 2 (restart explorer)')
        this.createExplorerConfig(payload)
        return await (new ExplorerInstance(this.config, this.infra)).restart()
      },
    }
  }
}
