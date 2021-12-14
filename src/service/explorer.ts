import fs from 'fs'
import { logger } from '../util/logger'
import { ExplorerConfigType, ExplorerUpForMyOrgType } from '../model/type/explorer.type'
import ExplorerConnectionProfileYaml from '../model/yaml/explorer/explorerConnectionProfileYaml'
import ExplorerConfigYaml from '../model/yaml/explorer/explorerConfigYaml'
import BdkFile from '../instance/bdkFile'
import Channel from './channel'
import ExplorerInstance from '../instance/explorer'
import { DockerResultType, InfraRunnerResultType } from '../instance/infra/InfraRunner.interface'
import { AbstractService, ParserType } from './Service.abstract'
import { Config } from '../config'
import ExplorerDockerComposeYaml from '../model/yaml/docker-compose/explorerDockerComposeYaml'

interface ExplorerParser extends ParserType {
  listJoinedChannel: (result: DockerResultType) => string[]
}

// TODO refactor
export default class Explorer extends AbstractService {
  static readonly parser: ExplorerParser = {
    listJoinedChannel: Channel.parser.listJoinedChannel,
  }

  /** @ignore */
  private hostBasePath: string

  /** @ignore */
  private dockerNetwork: string

  /** @ignore */
  private fabricExplorerVer: string

  /** @ignore */
  private fabricExplorerDbVer: string

  constructor (config: Config) {
    super(config)
    this.hostBasePath = this.bdkFile.getExplorerRootFilePath()
    // TODO: explorer應該要能跨network
    this.dockerNetwork = this.config.networkName
    this.fabricExplorerVer = this.config.fabricVersion.explorer
    this.fabricExplorerDbVer = this.config.fabricVersion.explorerDb
  }

  /**
   * @ignore
   * @description Clear explorer Folder
   */
  private clearFolder () {
    if (fs.existsSync(`${this.hostBasePath}`)) {
      logger.info('[*] Clear workspace: remove old env file')
      fs.rmdirSync(`${this.hostBasePath}`, { recursive: true })
    }
  }

  /**
   * @ignore
   * @description Initialize Folder
   */
  private initializeFolder () {
    this.clearFolder()
    fs.mkdirSync(`${this.hostBasePath}/connection-profile`, { recursive: true })
  }

  /**
   * @description 啟動 explorer
   */
  public async up (data: ExplorerConfigType[]): Promise<InfraRunnerResultType> {
    logger.info('[*] Blockchain Explorer up')

    const configJson = new ExplorerConfigYaml()

    // * clear config file
    this.initializeFolder()
    data.forEach(explorerConfig => {
      logger.info(`[*] Create file: ${explorerConfig.networkName}.json`)
      this.createConnectProfileYaml(explorerConfig)
      configJson.addNetwork(explorerConfig.networkName)
    })

    logger.info('[*] Create file: config.json')

    fs.writeFileSync(`${this.hostBasePath}/config.json`, configJson.getJsonString())

    logger.info('[*] Create file: docker-compose.yaml')
    const dockerComposeYaml = new ExplorerDockerComposeYaml(this.config)
    this.bdkFile.createExplorerDockerComposeYaml(dockerComposeYaml)

    logger.info('[*] Starting explorer container')

    return await (new ExplorerInstance(this.config, this.infra)).up()
  }

  /** @ignore */
  private updateConfigNetwork (data: ExplorerConfigType) {
    logger.info(`[*] Blockchain Explorer update network ${data.networkName} config`)
    const configJson = new ExplorerConfigYaml(JSON.parse(fs.readFileSync(`${this.hostBasePath}/config.json`).toString()))
    if (!configJson.getNetworkList().includes(data.networkName)) {
      configJson.addNetwork(data.networkName)
      fs.writeFileSync(`${this.hostBasePath}/config.json`, configJson.getJsonString())
    }
    this.createConnectProfileYaml(data)
  }

  /** @ignore */
  private createConnectProfileYaml (explorerConfig: ExplorerConfigType) {
    const rootFilePath = (new BdkFile(this.config, explorerConfig.networkName)).getRootFilePath()
    const explorerConnectProfileYaml = new ExplorerConnectionProfileYaml()

    explorerConnectProfileYaml.setName(explorerConfig.networkName)
    Object.keys(explorerConfig.orgs).forEach(org => {
      explorerConfig.orgs[org].peers.forEach(peer => {
        explorerConnectProfileYaml.addPeer(
          org,
          peer.url,
          fs.readFileSync(`${rootFilePath}/tlsca/${peer.url}/ca.crt`).toString(),
          peer.port)
      })
      explorerConnectProfileYaml.setOrgKey(
        org,
        this.bdkFile.getAdminPrivateKeyPem(explorerConfig.orgs[org].domain),
        this.bdkFile.getAdminSignCert(explorerConfig.orgs[org].domain),
      )
    })
    Object.keys(explorerConfig.channels).forEach(channel => {
      explorerConnectProfileYaml.addChannel(
        channel,
        explorerConfig.channels[channel].orgs.reduce((accumulator, org) => (accumulator.concat(explorerConfig.orgs[org].peers.map(x => x.url))), [] as string[]),
      )
    })
    explorerConnectProfileYaml.setClientOrganization(explorerConfig.clientOrganization)
    const networkJSONStr = explorerConnectProfileYaml.getJsonString()
    // const networkJSONStrOld = JSON.stringify(networkJson(config))

    fs.writeFileSync(
      `${this.hostBasePath}/connection-profile/${explorerConfig.networkName}.json`,
      networkJSONStr,
    )
  }

  /**
   * @description 關閉 explorer
   */
  public async down (): Promise<InfraRunnerResultType> {
    logger.info('[*] Explorer down')
    return await (new ExplorerInstance(this.config, this.infra)).down()
  }

  /** @ignore */
  private getExplorerConfig (peersAddress: string, orgDomainName: string, channel: string[]): ExplorerConfigType {
    return ({
      networkName: this.config.networkName,
      orgs: {
        [this.config.orgName]: {
          domain: orgDomainName,
          peers: [{ url: peersAddress.split(':')[0], port: parseInt(peersAddress.split(':')[1], 10) },
          ],
        },
      },
      clientOrganization: this.config.orgName,
      channels: (channel.reduce((accumulator: {[channelName: string]: {orgs: string[]}}, currentValue) => ({ ...accumulator, [currentValue]: { orgs: [this.config.orgName] } }), {})),
    })
  }

  /**
   * @description 啟動 peer org 的 explorer
   */
  public async upForMyOrg (payload: ExplorerUpForMyOrgType): Promise<void> {
    const listJoinedChannelResult = await this.upForMyOrgSteps().listJoinedChannel()
    if (!('stdout' in listJoinedChannelResult)) {
      logger.error('this service only for docker infra')
      throw new Error('this service for docker infra')
    }
    const joinedChannel = Explorer.parser.listJoinedChannel(listJoinedChannelResult)
    await this.upForMyOrgSteps().up({ ...payload, joinedChannel })
  }

  /**
   * @ignore
   */
  public upForMyOrgSteps () {
    return {
      listJoinedChannel: async (): Promise<InfraRunnerResultType> => {
        logger.info('[*] up explorer for my org step 1 (fetch joined channel)')
        return await (new Channel(this.config)).listJoinedChannel()
      },
      up: async (payload: ExplorerUpForMyOrgType): Promise<InfraRunnerResultType> => {
        logger.info('[*] up explorer for my org step 2 (start explorer)')
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await this.up([this.getExplorerConfig(payload.peerAddress, this.config.orgDomainName, payload.joinedChannel!)])
      },
    }
  }

  /**
   * @description 更新 explorer 的 peer org
   */
  public async updateForMyOrg (payload: ExplorerUpForMyOrgType): Promise<void> {
    const listJoinedChannelResult = await this.updateForMyOrgSteps().listJoinedChannel()
    if (!('stdout' in listJoinedChannelResult)) {
      logger.error('this service only for docker infra')
      throw new Error('this service for docker infra')
    }
    const joinedChannel = Explorer.parser.listJoinedChannel(listJoinedChannelResult)
    await this.updateForMyOrgSteps().restart({ ...payload, joinedChannel })
  }

  /**
   * @ignore
   */
  public updateForMyOrgSteps () {
    return {
      listJoinedChannel: async (): Promise<InfraRunnerResultType> => {
        logger.info('[*] update explorer for my org step 1 (fetch joined channel)')
        return await (new Channel(this.config, this.infra)).listJoinedChannel()
      },
      restart: async (payload: ExplorerUpForMyOrgType): Promise<InfraRunnerResultType> => {
        logger.info('[*] update explorer for my org step 2 (restart explorer)')
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.updateConfigNetwork(this.getExplorerConfig(payload.peerAddress, this.config.orgDomainName, payload.joinedChannel!))
        return await (new ExplorerInstance(this.config, this.infra)).restart()
      },
    }
  }
}
