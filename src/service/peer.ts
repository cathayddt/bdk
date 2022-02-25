import { logger } from '../util'
import { NetworkCryptoConfigPeerOrgType, NetworkCreatePeerOrgType, NetworkPeerPortType } from '../model/type/network.type'
import CryptoConfigYaml from '../model/yaml/network/cryptoConfigYaml'
import PeerDockerComposeYaml from '../model/yaml/docker-compose/peerDockerComposeYaml'
import PeerInstance from '../instance/peer'
import ConnectionProfileYaml from '../model/yaml/network/connectionProfileYaml'
import ConfigtxYaml from '../model/yaml/network/configtx'
import FabricTools from '../instance/fabricTools'
import Channel from './channel'
import { PeerUpType, PeerDownType, PeerAddType, PeerAddOrgToChannelType, PeerAddOrgToSystemChannelType } from '../model/type/peer.type'
import { InfraRunnerResultType } from '../instance/infra/InfraRunner.interface'
import { OrgPeerCreateType } from '../model/type/org.type'
import { AbstractService } from './Service.abstract'
import Org from './org'

export default class Peer extends AbstractService {
  /**
   * @description 啟動 peer 的機器
   */
  public async up (dto: PeerUpType): Promise<InfraRunnerResultType> {
    logger.debug(`Peer up: ${dto.peerHostname}`)
    return await (new PeerInstance(dto.peerHostname, this.config, this.infra)).up()
  }

  /**
   * @description 關閉 peer 的機器並且刪除其 volume 的資料
   */
  public async down (dto: PeerDownType): Promise<InfraRunnerResultType> {
    logger.debug(`Peer down: ${dto.peerHostname}`)
    return await (new PeerInstance(dto.peerHostname, this.config, this.infra).down())
  }

  /**
   * @description 由 cryptogen 產生 peer org 的憑證和私鑰
   * @returns 憑證和私鑰（~/.bdk/[blockchain network 名稱]/peerOrganizations/[peer org 的名稱] 資料夾底下）
   */
  public async cryptogen (dto: OrgPeerCreateType) {
    const { peerOrgs } = dto
    logger.debug('Peer create cryptogen')

    const cryptoConfigYaml = new CryptoConfigYaml()
    const peerOrgCryptoConfigYaml = this.createCryptoConfigYaml(peerOrgs)

    if (peerOrgCryptoConfigYaml && peerOrgCryptoConfigYaml.value.PeerOrgs) {
      cryptoConfigYaml.setPeerOrgs(peerOrgCryptoConfigYaml.value.PeerOrgs)
    }

    this.bdkFile.createCryptoConfigYaml(cryptoConfigYaml)

    await (new FabricTools(this.config, this.infra)).cryptogenGenerateCryptoConfig()
  }

  /**
   * @description 由 peer org 的 configtx.yaml 產生 peer org 設定的 json 檔案
   * @returns peer org 設定的 json 檔案（在 ~/.bdk/[blockchain network 名稱]/org-json）
   */
  public async createPeerOrgConfigtxJSON (dto: OrgPeerCreateType) {
    const { peerOrgs } = dto

    for (const peerOrg of peerOrgs) {
      logger.debug(`Peer create configtx: ${peerOrg.name}`)
      const configtxYaml = new ConfigtxYaml()
      const newOrg = configtxYaml.addPeerOrg({
        name: peerOrg.name,
        mspDir: `${this.config.infraConfig.dockerPath}/peerOrganizations/${peerOrg.domain}/msp`,
        domain: peerOrg.domain,
        anchorPeers: [{ hostname: `${this.config.hostname}.${this.config.orgDomainName}`, port: peerOrg?.ports?.[+(this.config.hostname.slice(4, 0))]?.port }],
      })
      this.bdkFile.createConfigtxPeerOrg(newOrg)
      await (new Org(this.config, this.infra)).createOrgDefinitionJson(peerOrg.name, configtxYaml)
    }
  }

  /**
   * @description 複製 TLS CA 到 blockchain network 底下指定的資料夾
   * @returns 複製 TLS CA 到 blockchain network 底下的資料夾 tlsca/[peer hostname 的名稱].[domain 的名稱]/ca.crt
   */
  public copyTLSCa (dto: OrgPeerCreateType) {
    const { peerOrgs } = dto
    peerOrgs.forEach((peerOrg: NetworkCreatePeerOrgType) => {
      logger.debug(`Peer create copyTLSCa: ${peerOrg.name}`)
      for (let i = 0; i < peerOrg.peerCount; i++) {
        this.bdkFile.copyPeerOrgTLSCa(`peer${i}`, peerOrg.domain)
      }
    })
  }

  /**
   * @description 產生 peer org 的連線設定 yaml 檔案
   * @returns peer org 連線設定的 yaml 檔案（在 ~/.bdk/[blockchain network 名稱]/peerOrganizations/[domain 的名稱]/connection-[peer org 的名稱].yaml）
   */
  public createConnectionProfileYaml (dto: OrgPeerCreateType) {
    const { peerOrgs } = dto
    peerOrgs.forEach((peerOrg) => {
      logger.debug(`Peer create connection config: ${peerOrg.name}`)
      const connectionProfileYaml = new ConnectionProfileYaml()

      connectionProfileYaml.setName(`${this.config.networkName}-${peerOrg.name}`)
      connectionProfileYaml.setClientOrganization(peerOrg.name)

      for (let i = 0; i < peerOrg.peerCount; i++) {
        connectionProfileYaml.addPeer(
          peerOrg.name,
          `peer${i}.${peerOrg.domain}`,
          this.bdkFile.getPeerOrgTlsCertString(i, peerOrg.domain),
          peerOrg.ports?.[i]?.port,
        )
      }

      this.bdkFile.createConnectionFile(peerOrg.name, peerOrg.domain, connectionProfileYaml)
    })
  }

  /**
   * @description 在 peer org 新增 peer
   * @returns  peer org 的 docker compose yaml 檔案（在 ~/.bdk/[blockchain network 名稱]/docker-compose/[domain 的名稱]/docker-compose-peer-[peer 的 hostname].[peer org 的名稱].yaml）
   */
  public add (dto: PeerAddType) { // if port[i] is not undefine, use this port and publish a container's port to the host. else use default port.
    logger.debug('Peer add')

    this.createPeerOrgDockerComposeYaml(dto.orgName || this.config.orgName, dto.orgDomain || this.config.orgDomainName, dto.peerCount, dto.ports)
  }

  /**
   * @description 產生多個 peer org 的 docker compose
   * @returns  peer org 的 docker compose yaml 檔案（在 ~/.bdk/[blockchain network 名稱]/docker-compose 底下）
   */
  public createDockerCompose (dto: OrgPeerCreateType) {
    const { peerOrgs } = dto
    peerOrgs.forEach((peerOrg) => {
      logger.debug(`Peer create docker-compose: ${peerOrg.name}`)
      this.createPeerOrgDockerComposeYaml(peerOrg.name, peerOrg.domain, peerOrg.peerCount, peerOrg.ports)
    })
  }

  /**
   * @description 產生 peer org 的 docker compose
   * @param peerName - [string] peer org 的名稱
   * @param peerDomain - [string] peer org domain 的名稱
   * @param peerCount - [number] peer org 中 peer 的個數
   * @param ports - [{@link NetworkPeerPortType} array] peer org 中 port 設定
   * @returns  peer org 的 docker compose yaml 檔案（在 ~/.bdk/[blockchain network 名稱]/docker-compose/[domain 的名稱]/docker-compose-peer-[peer 的 hostname].[peer org 的名稱].yaml）
   */
  public createPeerOrgDockerComposeYaml (peerName: string, peerDomain: string, peerCount: number, ports?: NetworkPeerPortType[]) {
    for (let i = 0; i < peerCount; i++) {
      const bootstrapPeerNumber = (i + 1) % peerCount
      const peerDockerComposeYaml = new PeerDockerComposeYaml()

      peerDockerComposeYaml.addNetwork(this.config.networkName, { name: this.config.networkName, external: true })
      peerDockerComposeYaml.addPeer(this.config, peerName, peerDomain, i, bootstrapPeerNumber, ports?.[bootstrapPeerNumber]?.port, ports?.[i]?.port, ports?.[i]?.operationPort, ports?.[i]?.isPublishPort, ports?.[i]?.isPublishOperationPort)

      this.bdkFile.createDockerComposeYaml(`peer${i}.${peerDomain}`, peerDockerComposeYaml)

      this.bdkFile.createOrgConfigEnv(`peer-peer${i}.${peerDomain}`, peerDockerComposeYaml.getPeerOrgEnv(this.config, peerName, i, peerDomain, ports?.[i]?.port))
    }
  }

  /**
   * @description 產生 crypto config 所需的文字
   * @returns null ｜ crypto config 所需的文字
   */
  public createCryptoConfigYaml (cryptoConfigPeerOrg: NetworkCryptoConfigPeerOrgType[]) {
    const cryptConfigYaml = new CryptoConfigYaml()

    cryptoConfigPeerOrg.forEach(x => cryptConfigYaml.addPeerOrg({
      Name: x.name,
      Domain: x.domain,
      EnableNodeOUs: x.enableNodeOUs,
      Template: {
        Count: x.peerCount,
      },
      Users: {
        Count: x.userCount,
      },
    }))

    return cryptoConfigPeerOrg.length === 0 ? null : cryptConfigYaml
  }

  /**
   * @description 在 channel 中加入 peer org
   */
  public async addOrgToChannel (dto: PeerAddOrgToChannelType): Promise<void> {
    await this.addOrgToChannelSteps().fetchChannelConfig(dto)
    await this.addOrgToChannelSteps().computeUpdateConfigTx(dto)
  }

  /**
   * @ignore
   */
  public addOrgToChannelSteps () {
    return {
      fetchChannelConfig: async (dto: PeerAddOrgToChannelType): Promise<InfraRunnerResultType> => {
        logger.debug('add org to channel step1 (fetchChannelConfig)')
        return await (new Channel(this.config, this.infra)).fetchChannelConfig(dto.channelName)
      },
      computeUpdateConfigTx: async (dto: PeerAddOrgToChannelType) => {
        logger.debug('add org to channel step2 (orgConfigComputeUpdateAndSignConfigTx)')
        const { channelName, orgName } = dto
        const newOrg = JSON.parse(this.bdkFile.getOrgConfigJson(orgName))
        const updateFunction = (configBlock: any) => {
          const modifiedConfigBlock = JSON.parse(JSON.stringify(configBlock))
          modifiedConfigBlock.channel_group.groups.Application.groups = {
            ...modifiedConfigBlock.channel_group.groups.Application.groups,
            [orgName]: newOrg,
          }
          return modifiedConfigBlock
        }
        return await (new Channel(this.config, this.infra)).computeUpdateConfigTx(channelName, updateFunction)
      },
    }
  }

  /**
   * @description 在 system-channel 中加入 peer org
   */
  public async addOrgToSystemChannel (dto: PeerAddOrgToSystemChannelType): Promise<void> {
    await this.addOrgToSystemChannelSteps().fetchChannelConfig(dto)
    await this.addOrgToSystemChannelSteps().computeUpdateConfigTx(dto)
  }

  /**
   * @ignore
   */
  public addOrgToSystemChannelSteps () {
    return {
      fetchChannelConfig: async (dto: PeerAddOrgToSystemChannelType): Promise<InfraRunnerResultType> => {
        logger.debug('add org to system channel step1 (fetchChannelConfig)')
        return await (new Channel(this.config, this.infra)).fetchChannelConfig(dto.channelName, dto.orderer)
      },
      computeUpdateConfigTx: async (dto: PeerAddOrgToSystemChannelType) => {
        logger.debug('add org to system channel step2 (orgConfigComputeUpdateAndSignConfigTx)')
        const { channelName, orgName } = dto

        const newOrg = JSON.parse(this.bdkFile.getOrgConfigJson(orgName))
        const updateFunction = (configBlock: any) => {
          const modifiedConfigBlock = JSON.parse(JSON.stringify(configBlock))
          modifiedConfigBlock.channel_group.groups.Consortiums.groups.AllOrganizationsConsortium.groups = {
            ...modifiedConfigBlock.channel_group.groups.Consortiums.groups.AllOrganizationsConsortium.groups,
            [orgName]: newOrg,
          }
          return modifiedConfigBlock
        }

        return await (new Channel(this.config, this.infra)).computeUpdateConfigTx(channelName, updateFunction)
      },
    }
  }
}
