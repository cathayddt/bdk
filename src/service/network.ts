import {
  NetworkCreateType,
  NetworkCreateOrdererOrgType,
  NetworkCreatePeerOrgType,
} from '../model/type/network.type'
import { logger, ParamsError } from '../util'
import ConfigtxYaml from '../model/yaml/network/configtx'
import CryptoConfigYaml from '../model/yaml/network/cryptoConfigYaml'
import Peer from './peer'
import Orderer from './orderer'
import PeerInstance from '../instance/peer'
import OrdererInstance from '../instance/orderer'
import CAInstance from '../instance/ca'
import { Config } from './../config'
import BdkFile from '../instance/bdkFile'
import FabricTools from '../instance/fabricTools'
import { AbstractService } from './Service.abstract'
import Org from './org'

export default class Network extends AbstractService {
  /** @ignore */
  private profileName: string

  constructor (config: Config) {
    super(config)
    this.profileName = `${config.networkName}Genesis`
  }

  /**
   * @description 建立 blockchain network
   * @returns blockchain network 名稱的資料夾（在 ～/.bdk 資料夾底下）
   */
  public createNetworkFolder () {
    this.bdkFile.createNetworkFolder()
  }

  /**
   * @description 刪除 blockchain network 的相關資訊
   * @param networkName blockchain network 的名稱
   */
  public async delete (networkName: string) {
    logger.debug(`Delete network ${networkName}`)

    const hostNames = this.bdkFile.getDockerComposeList()

    for (const ordererOrgName of hostNames.orderer) {
      await (new OrdererInstance(`${ordererOrgName}`, this.config, this.infra)).down()
    }

    for (const peerHostName of hostNames.peer) {
      await (new PeerInstance(peerHostName, this.config, this.infra)).down()
    }

    for (const caHostName of hostNames.ca) {
      await (new CAInstance(caHostName, this.config, this.infra)).down()
    }

    if (networkName !== this.config.networkName) {
      new BdkFile(this.config, networkName).deleteNetworkFolder()
    } else {
      this.bdkFile.deleteNetworkFolder()
    }
  }

  /**
   * @description 由 cryptogen 產生 peer org 和 orderer org 的憑證和私鑰
   * @returns 憑證和私鑰
   */
  public async cryptogen (dto: NetworkCreateType) {
    logger.debug(`Network create cryptogen: ${this.config.networkName}`)

    const cryptoConfigYaml = this.createCryptoConfigYaml(dto)
    await this.cryptogenGenerate(cryptoConfigYaml)
  }

  /**
   * @description 複製 TLS CA 到 blockchain network 底下指定的資料夾
   * @returns 複製 TLS CA 到 blockchain network 底下的資料夾 tlsca/[peer hostname 的名稱].[domain 的名稱]/ca.crt
   */
  public copyTLSCa (dto: NetworkCreateType) {
    logger.debug(`Network create copyTLSCa: ${this.config.networkName}`)

    dto.ordererOrgs && dto.ordererOrgs.forEach((ordererOrg: NetworkCreateOrdererOrgType) => {
      for (let i = 0; i < ordererOrg.hostname.length; i++) {
        this.bdkFile.copyOrdererOrgTLSCa(ordererOrg.hostname[i], ordererOrg.domain)
      }
    })

    dto.peerOrgs && dto.peerOrgs.forEach((peerOrg: NetworkCreatePeerOrgType) => {
      for (let i = 0; i < peerOrg.peerCount; i++) {
        this.bdkFile.copyPeerOrgTLSCa(`peer${i}`, peerOrg.domain)
      }
    })
  }

  /**
   * @description 產生創始區塊檔案
   * @returns 創始區塊檔案（～/.bdk/bdk/channel-artifacts/system-channel/genesis.block）
   */
  public async createGenesisBlock (dto: NetworkCreateType) {
    logger.debug(`Network create genesis.block: ${this.config.networkName}`)

    await this.createGenesisConfigtxYaml(dto)
    await (new FabricTools(this.config, this.infra)).cryptogenGenerateGenesisBlock(this.profileName)
  }

  /**
   * @description 產生 blockahin network 的連線設定 yaml 檔案
   * @returns blockchain network 連線設定的 yaml 檔案（在 ~/.bdk/[blockchain network 名稱]/peerOrganizations/[domain 的名稱]/connection-[peer org 的名稱].yaml）
   */
  public createConnectionProfile (dto: NetworkCreateType) {
    logger.debug(`Network create connection config profile: ${this.config.networkName}`)

    if (dto.peerOrgs === undefined) {
      throw new ParamsError('Invalid params: Required parameter <peerOrgs> missing')
    }

    (new Peer(this.config, this.infra)).createConnectionProfileYaml(dto)
  }

  /**
   * @description 產生 blockchain network 的 docker-compose.yaml 檔案
   * @returns peer org 和 orderer org 的 docker compose yaml 檔案
   */
  public createDockerCompose (dto: NetworkCreateType) {
    logger.debug(`Network create docker-compose-{ordererOrgName/peerOrgName}.yaml: ${this.config.networkName}`)

    dto.ordererOrgs && dto.ordererOrgs.forEach((ordererOrg: NetworkCreateOrdererOrgType) => {
      (new Orderer(this.config, this.infra)).add({
        orgName: ordererOrg.name,
        orgDomain: ordererOrg.domain,
        ordererHostnames: ordererOrg.hostname,
        genesisFileName: 'genesis',
        ports: ordererOrg.ports,
      })
    })

    dto.peerOrgs && dto.peerOrgs.forEach((peerOrg: NetworkCreatePeerOrgType) => {
      (new Peer(this.config, this.infra)).add({
        orgName: peerOrg.name,
        orgDomain: peerOrg.domain,
        peerCount: peerOrg.peerCount,
        ports: peerOrg.ports,
      })
    })
  }

  /** @ignore */
  private createCryptoConfigYaml (dto: NetworkCreateType): CryptoConfigYaml {
    logger.debug('Create crypto-config.yaml')

    const cryptoConfigYaml = new CryptoConfigYaml()

    const ordererCryptConfigYaml = (new Orderer(this.config, this.infra)).createCryptoConfigYaml(dto.ordererOrgs || [])
    const peerCryptConfigYaml = (new Peer(this.config, this.infra)).createCryptoConfigYaml(dto.peerOrgs || [])

    if (ordererCryptConfigYaml && ordererCryptConfigYaml.value.OrdererOrgs) {
      cryptoConfigYaml.setOrdererOrgs(ordererCryptConfigYaml.value.OrdererOrgs)
    }

    if (peerCryptConfigYaml && peerCryptConfigYaml.value.PeerOrgs) {
      cryptoConfigYaml.setPeerOrgs(peerCryptConfigYaml.value.PeerOrgs)
    }

    return cryptoConfigYaml
  }

  /** @ignore */
  private async cryptogenGenerate (cryptoConfigYaml: CryptoConfigYaml) {
    logger.debug('Create configtx.yaml by cryptogen')

    this.bdkFile.createCryptoConfigYaml(cryptoConfigYaml)

    await (new FabricTools(this.config, this.infra)).cryptogenGenerateCryptoConfig()
  }

  /** @ignore */
  private async createGenesisConfigtxYaml (dto: NetworkCreateType): Promise<ConfigtxYaml> {
    logger.debug('Create genesis.block')

    if (dto.ordererOrgs === undefined) throw new ParamsError('Invalid params: Required parameter <ordererOrgs> missing')
    if (dto.peerOrgs === undefined) throw new ParamsError('Invalid params: Required parameter <peerOrgs> missing')

    const orgNames: string[] = []

    dto.ordererOrgs.forEach((item) => {
      orgNames.push(item.name)
    })

    dto.peerOrgs.forEach((item) => {
      orgNames.push(item.name)
    })

    const checkOrgNameRepeat = orgNames.filter((orgName, index, arr) => {
      return arr.indexOf(orgName) !== index
    })

    if (checkOrgNameRepeat.length !== 0) throw new ParamsError('Invalid params: Duplicate parameters in <orderer-org-name> <peer-org-name>')

    const configtxYaml = new ConfigtxYaml()
    const etcdRaftConsenters: { Host: string; Port: number; ClientTLSCert: string; ServerTLSCert: string }[] = []

    dto.ordererOrgs.forEach(ordererOrg => {
      const newOrg = configtxYaml.addOrdererOrg({
        name: ordererOrg.name,
        mspDir: `${this.config.infraConfig.dockerPath}/ordererOrganizations/${ordererOrg.domain}/msp`,
        domain: ordererOrg.domain,
        hostname: ordererOrg.hostname,
        ports: ordererOrg.ports?.map(x => x.port),
      })
      this.bdkFile.createConfigtxOrdererOrg(newOrg)

      ordererOrg.hostname.forEach((hostname, i) => {
        etcdRaftConsenters.push({
          Host: `${hostname}.${ordererOrg.domain}`,
          Port: ordererOrg.ports?.[i]?.port || 7050,
          ClientTLSCert: `${this.config.infraConfig.dockerPath}/ordererOrganizations/${ordererOrg.domain}/orderers/${hostname}.${ordererOrg.domain}/tls/server.crt`,
          ServerTLSCert: `${this.config.infraConfig.dockerPath}/ordererOrganizations/${ordererOrg.domain}/orderers/${hostname}.${ordererOrg.domain}/tls/server.crt`,
        })
      })
    })

    dto.peerOrgs.forEach(peerOrg => {
      const newOrg = configtxYaml.addPeerOrg({
        name: peerOrg.name,
        mspDir: `${this.config.infraConfig.dockerPath}/peerOrganizations/${peerOrg.domain}/msp`,
        domain: peerOrg.domain,
        anchorPeers: [{ hostname: `peer0.${peerOrg.domain}`, port: peerOrg?.ports?.[0]?.port }],
      })
      this.bdkFile.createConfigtxPeerOrg(newOrg)
    })

    configtxYaml.addSystemChannelProfile({
      name: this.profileName,
      etcdRaftConsenters,
      ordererOrgs: dto.ordererOrgs.map(ordererOrg => (ordererOrg.name)),
      consortiums: {
        AllOrganizationsConsortium: dto.peerOrgs.map(peerOrg => peerOrg.name),
      },
    })

    for (const ordererOrg of dto.ordererOrgs) {
      await (new Org(this.config, this.infra)).createOrgDefinitionJson(ordererOrg.name, configtxYaml)
      this.bdkFile.createOrdererOrgConsenterJson(ordererOrg.name, JSON.stringify(new Orderer(this.config, this.infra).ordererConsenter(ordererOrg)))
    }

    for (const peerOrg of dto.peerOrgs) {
      await (new Org(this.config, this.infra)).createOrgDefinitionJson(peerOrg.name, configtxYaml)
    }

    this.bdkFile.createConfigtx(configtxYaml)

    return configtxYaml
  }
}
