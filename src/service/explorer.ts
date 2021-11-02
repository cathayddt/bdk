import fs from 'fs'
import { logger } from '../util/logger'
import { ExplorerConfigType, ExplorerUpForMyOrgType } from '../model/type/explorer.type'
import ConnectProfileYaml from '../model/yaml/explorer/connectProfileYaml.ts'
import ExplorerConfig from '../model/yaml/explorer/config'
import DockerComposeYaml from '../model/yaml/docker-compose/dockerComposeYaml'
import BdkFile from '../instance/bdkFile'
import Channel from './channel'
import ExplorerInstance from '../instance/explorer'
import { DockerResultType, InfraRunnerResultType } from '../instance/infra/InfraRunner.interface'
import { AbstractService, ParserType } from './Service.abstract'
import { Config } from '../config'

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

    const configJson = new ExplorerConfig()

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
    const dockerComposeYaml = new DockerComposeYaml()
    dockerComposeYaml.addNetwork(this.dockerNetwork, { name: this.dockerNetwork, external: true })
    dockerComposeYaml.addVolume(`explorerdb.${this.dockerNetwork}`, {})
    dockerComposeYaml.addService(
      `explorerdb.${this.dockerNetwork}`,
      {
        image: `hyperledger/explorer-db:${this.fabricExplorerDbVer}`,
        container_name: `explorerdb.${this.dockerNetwork}`,
        hostname: `explorerdb.${this.dockerNetwork}`,
        environment: [
          'DATABASE_DATABASE=fabricexplorer',
          'DATABASE_USERNAME=hppoc',
          'DATABASE_PASSWORD=password',
        ],
        healthcheck: {
          test: 'pg_isready -h localhost -p 5432 -q -U postgres',
          interval: '30s',
          timeout: '10s',
          retries: 5,
        },
        volumes: [
          `explorerdb.${this.dockerNetwork}:/var/lib/postgresql/data`,
        ],
        networks: [
          this.dockerNetwork,
        ],
      },
    )
    dockerComposeYaml.addService(
      `explorer.${this.dockerNetwork}`,
      {
        image: `hyperledger/explorer:${this.fabricExplorerVer}`,
        container_name: `explorer.${this.dockerNetwork}`,
        hostname: `explorer.${this.dockerNetwork}`,
        environment: [
          `DATABASE_HOST=explorerdb.${this.dockerNetwork}`,
          'DATABASE_DATABASE=fabricexplorer',
          'DATABASE_USERNAME=hppoc',
          'DATABASE_PASSWD=password',
          'LOG_LEVEL_APP=debug',
          'LOG_LEVEL_DB=debug',
          'LOG_LEVEL_CONSOLE=info',
          'LOG_CONSOLE_STDOUT=true',
          'DISCOVERY_AS_LOCALHOST=false',
        ],
        volumes: [
          `${this.hostBasePath}/config.json:/opt/explorer/app/platform/fabric/config.json`,
          `${this.hostBasePath}/connection-profile:/opt/explorer/app/platform/fabric/connection-profile`,
        ],
        ports: [
          '8080:8080',
        ],
        depends_on: {
          [`explorerdb.${this.dockerNetwork}`]: {
            condition: 'service_healthy',
          },
        },
        networks: [
          this.dockerNetwork,
        ],
      },
    )
    fs.writeFileSync(
      `${this.hostBasePath}/docker-compose.yaml`,
      dockerComposeYaml.getYamlString(),
    )

    logger.info('[*] Starting explorer container')

    return await (new ExplorerInstance(this.config, this.infra)).up()
  }

  /** @ignore */
  private updateConfigNetwork (data: ExplorerConfigType) {
    logger.info(`[*] Blockchain Explorer update network ${data.networkName} config`)
    const configJson = new ExplorerConfig(JSON.parse(fs.readFileSync(`${this.hostBasePath}/config.json`).toString()))
    if (!configJson.getNetworkList().includes(data.networkName)) {
      configJson.addNetwork(data.networkName)
      fs.writeFileSync(`${this.hostBasePath}/config.json`, configJson.getJsonString())
    }
    this.createConnectProfileYaml(data)
  }

  /** @ignore */
  private createConnectProfileYaml (explorerConfig: ExplorerConfigType) {
    const rootFilePath = (new BdkFile(this.config, explorerConfig.networkName)).getRootFilePath()
    const connectProfileYaml = new ConnectProfileYaml()

    connectProfileYaml.setName(explorerConfig.networkName)
    Object.keys(explorerConfig.orgs).forEach(org => {
      explorerConfig.orgs[org].peers.forEach(peer => {
        connectProfileYaml.addPeer(
          org,
          peer.url,
          fs.readFileSync(`${rootFilePath}/tlsca/${peer.url}/ca.crt`).toString(),
          peer.port)
      })
      connectProfileYaml.setOrgKey(
        org,
        fs.readFileSync(`${rootFilePath}/peerOrganizations/${explorerConfig.orgs[org].domain}/users/Admin@${explorerConfig.orgs[org].domain}/msp/keystore/priv_sk`).toString(),
        fs.readFileSync(`${rootFilePath}/peerOrganizations/${explorerConfig.orgs[org].domain}/users/Admin@${explorerConfig.orgs[org].domain}/msp/signcerts/Admin@${explorerConfig.orgs[org].domain}-cert.pem`).toString(),
      )
    })
    Object.keys(explorerConfig.channels).forEach(channel => {
      connectProfileYaml.addChannel(
        channel,
        explorerConfig.channels[channel].orgs.reduce((accumulator, org) => (accumulator.concat(explorerConfig.orgs[org].peers.map(x => x.url))), [] as string[]),
      )
    })
    connectProfileYaml.setClientOrganization(explorerConfig.clientOrganization)
    const networkJSONStr = connectProfileYaml.getJsonString()
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
