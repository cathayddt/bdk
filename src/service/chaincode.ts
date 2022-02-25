import path from 'path'
import FabricTools from '../instance/fabricTools'
import FabricInstance from '../instance/fabricInstance'
import { ChaincodeApproveStepApproveOnInstanceType, ChaincodeApproveType, ChaincodeCommitStepCommitOnInstanceType, ChaincodeApproveWithoutDiscoverType, ChaincodeCommitType, ChaincodeInstallStepSavePackageIdType, ChaincodeInstallType, ChaincodeInvokeType, ChaincodePackageType, ChaincodeQueryType, ChaincodeCommitWithoutDiscoverType, ChaincodeInvokeStepInvokeOnInstanceType, ChaincodeInvokeWithoutDiscoverType } from '../model/type/chaincode.type'
import { ParserType, AbstractService } from './Service.abstract'
import { logger } from '../util/logger'
import { DockerResultType, InfraRunnerResultType } from '../instance/infra/InfraRunner.interface'
import Discover from './discover'
import { randomFromArray } from '../util/utils'

interface ChaincodeParser extends ParserType {
  installToPeer: (result: DockerResultType, options: {chaincodeLabel: string}) => string
  invoke: (result: DockerResultType) => any
  query: (result: DockerResultType) => any
  getChaincodePackageId: (result: DockerResultType, options: {chaincodeLabel: string}) => string
  getCommittedChaincode: (result: DockerResultType) => string[]
  approveStepDiscover: (result: DockerResultType) => string
  commitStepDiscoverChannelConfig: (result: DockerResultType) => string
  commitStepDiscoverPeers: (result: DockerResultType) => string[]
  invokeStepDiscoverChannelConfig: (result: DockerResultType) => string
  invokeStepDiscoverEndorsers: (result: DockerResultType) => string[]
}

export default class Chaincode extends AbstractService {
  static readonly parser: ChaincodeParser = {
    installToPeer: (result, options: {chaincodeLabel: string}) => result.stdout.match(RegExp(`(?<=Chaincode code package identifier: )${options.chaincodeLabel}:.*(?=\r\n$)`))?.[0] || '',
    invoke: (result) => JSON.parse(result.stdout.match(/(?<=Chaincode invoke successful. result: status:200 payload:").*(?=" \r\n)/)?.[0].replace(/\\"/g, '"') || '{}'),
    query: (result) => JSON.parse(result.stdout || '{}'),
    getChaincodePackageId: (result, options: {chaincodeLabel: string}) => result.stdout.match(RegExp(`(?<=Package ID: )${options.chaincodeLabel}:.*(?=, Label: ${options.chaincodeLabel})`))?.[0] || '',
    getCommittedChaincode: (result) => result.stdout.match(/(?<=Name: ).*(?=, Version)/g) || [],
    approveStepDiscover: (result) => Discover.chooseOneRandomOrderer(Discover.parser.channelConfig(result)),
    commitStepDiscoverChannelConfig: (result) => Discover.chooseOneRandomOrderer(Discover.parser.channelConfig(result)),
    commitStepDiscoverPeers: (result) => {
      const peerDiscoverResult = Discover.parser.peers(result)
      const peerList: Map<string, string[]> = new Map()
      peerDiscoverResult.forEach(peer => {
        peerList.has(peer.MSPID) ? peerList.get(peer.MSPID)?.push(peer.Endpoint) : peerList.set(peer.MSPID, [peer.Endpoint])
      })
      const peers: string[] = []
      Array.from(peerList.keys()).forEach(org => {
        const peersOfOrg = peerList.get(org) || []
        peers.push(randomFromArray(peersOfOrg))
      })
      return peers
    },
    invokeStepDiscoverChannelConfig: (result) => Discover.chooseOneRandomOrderer(Discover.parser.channelConfig(result)),
    invokeStepDiscoverEndorsers: (result) => {
      const endorserDiscoverResult = Discover.parser.chaincodeEndorsers(result)
      const layout = randomFromArray(endorserDiscoverResult[0].Layouts)
      return (Object.keys(layout.quantities_by_group).map(group => (randomFromArray(endorserDiscoverResult[0].EndorsersByGroups[group]).Endpoint)))
    },
  }

  /**
   * @description 打包 chaincode 成 tar 檔案
   * @returns 在 ./chaincode 中 [chaincode 的名稱]_[cahincode 的版本].tar
   */
  public async package (payload: ChaincodePackageType) {
    logger.debug('Package chaincode')
    this.bdkFile.createChaincodeFolder()
    await (new FabricTools(this.config, this.infra)).packageChaincode(payload.name, payload.version, path.resolve(payload.path))
  }

  /**
   * @description 執行 chaincode 上的 function 發送交易
   * @returns 執行 chaincode function 的回覆
   */
  public async invoke (payload: ChaincodeInvokeType | ChaincodeInvokeWithoutDiscoverType): Promise<InfraRunnerResultType> {
    let orderer: string
    let peerAddresses: string[]

    if ('orderer' in payload) {
      orderer = payload.orderer
    } else {
      const discoverChannelConfigResult = await this.invokeSteps().discoverChannelConfig(payload)
      if (!('stdout' in discoverChannelConfigResult)) {
        logger.error('this service only for docker infra')
        throw new Error('this service for docker infra')
      }
      orderer = Chaincode.parser.invokeStepDiscoverChannelConfig(discoverChannelConfigResult)
    }

    if ('peerAddresses' in payload) {
      peerAddresses = payload.peerAddresses
    } else {
      const discoverEndorsersResult = await this.invokeSteps().discoverEndorsers(payload)
      if (!('stdout' in discoverEndorsersResult)) {
        logger.error('this service only for docker infra')
        throw new Error('this service for docker infra')
      }
      peerAddresses = Chaincode.parser.invokeStepDiscoverEndorsers(discoverEndorsersResult)
    }

    return await this.invokeSteps().invokeOnInstance({ ...payload, orderer, peerAddresses })
  }

  /**
   * @ignore
   */
  public invokeSteps () {
    return {
      discoverEndorsers: async (payload: ChaincodeInvokeType): Promise<InfraRunnerResultType> => {
        logger.debug('invoke chaincode step 1 (discover endorsers)')
        return await (new Discover(this.config)).chaincodeEndorsers({ channel: payload.channelId, chaincode: payload.chaincodeName })
      },
      discoverChannelConfig: async (payload: ChaincodeInvokeType): Promise<InfraRunnerResultType> => {
        logger.debug('invoke chaincode step 2 (discover channel config)')
        return await (new Discover(this.config)).channelConfig({ channel: payload.channelId })
      },
      invokeOnInstance: async (payload: ChaincodeInvokeStepInvokeOnInstanceType): Promise<InfraRunnerResultType> => {
        logger.debug('invoke chaincode step 3 (invoke)')
        return await (new FabricInstance(this.config, this.infra)).invokeChaincode(payload.channelId, payload.chaincodeName, payload.chaincodeFunction, payload.args, payload.isInit, payload.orderer, payload.peerAddresses)
      },
    }
  }

  /**
   * @description 執行 chaincode 上的 function 查詢
   * @returns 執行 chaincode function 的回覆
   */
  public async query (payload: ChaincodeQueryType): Promise<InfraRunnerResultType> {
    logger.debug('query chaincode')
    return await (new FabricInstance(this.config, this.infra)).queryChaincode(payload.channelId, payload.chaincodeName, payload.chaincodeFunction, payload.args)
  }

  /**
   * @ignore
   */
  public async install (dto: ChaincodeInstallType): Promise<string> {
    const installToPeerResult = await this.installSteps().installToPeer(dto)
    if (!('stdout' in installToPeerResult)) {
      logger.error('this service only for docker infra')
      throw new Error('this service for docker infra')
    }
    const packageId = Chaincode.parser.installToPeer(installToPeerResult, { chaincodeLabel: dto.chaincodeLabel })
    return this.installSteps().savePackageId({ ...dto, packageId })
  }

  /**
   * @ignore
   */
  public installSteps () {
    return {
      installToPeer: async (dto: ChaincodeInstallType): Promise<InfraRunnerResultType> => {
        logger.debug('install chaincode step 1 (install chaincode)')
        return await (new FabricInstance(this.config, this.infra)).installChaincode(dto.chaincodeLabel)
      },
      savePackageId: (dto: ChaincodeInstallStepSavePackageIdType): string => {
        logger.debug('install chaincode step 2 (save package id)')
        this.bdkFile.savePackageId(dto.chaincodeLabel, dto.packageId || '')
        return dto.packageId || ''
      },
    }
  }

  /**
   * @description 取得 chaincode 安裝編號
   * @param chaincodeLabel - chaincode 的標籤名稱
   * @returns chaincode 的安裝編號
   */
  public async getChaincodePackageId (): Promise<InfraRunnerResultType> {
    logger.debug('query installed and get package id')
    return await (new FabricInstance(this.config, this.infra)).queryInstalledChaincode()
  }

  /**
   * @description 同意 chaincode
   */
  public async approve (payload: ChaincodeApproveType | ChaincodeApproveWithoutDiscoverType): Promise<InfraRunnerResultType> {
    let orderer: string
    if ('orderer' in payload) {
      orderer = payload.orderer
    } else {
      const discoverResult = await this.approveSteps().discover(payload)
      if (!('stdout' in discoverResult)) {
        logger.error('this service only for docker infra')
        throw new Error('this service for docker infra')
      }
      orderer = Chaincode.parser.approveStepDiscover(discoverResult)
    }
    return await this.approveSteps().approveOnInstance({ ...payload, orderer })
  }

  /**
   * @ignore
   */
  public approveSteps () {
    return {
      discover: async (payload: ChaincodeApproveType): Promise<InfraRunnerResultType> => {
        logger.debug('approve chaincode step 1 (discover)')
        return await (new Discover(this.config)).channelConfig({ channel: payload.channelId })
      },
      approveOnInstance: async (payload: ChaincodeApproveStepApproveOnInstanceType): Promise<InfraRunnerResultType> => {
        logger.debug('approve chaincode step 2 (approve)')
        const packageId = this.bdkFile.getPackageId(`${payload.chaincodeName}_${payload.chaincodeVersion}`)
        return await (new FabricInstance(this.config, this.infra)).approveChaincode(payload.channelId, payload.chaincodeName, payload.chaincodeVersion, packageId, payload.initRequired, payload.orderer)
      },
    }
  }

  /**
   * @description 發布 chaincode
   */
  public async commit (payload: ChaincodeCommitType | ChaincodeCommitWithoutDiscoverType): Promise<InfraRunnerResultType> {
    let orderer: string
    let peerAddresses: string[]

    if ('orderer' in payload) {
      orderer = payload.orderer
    } else {
      const discoverChannelConfigResult = await this.commitSteps().discoverChannelConfig(payload)
      if (!('stdout' in discoverChannelConfigResult)) {
        logger.error('this service only for docker infra')
        throw new Error('this service for docker infra')
      }
      orderer = Chaincode.parser.commitStepDiscoverChannelConfig(discoverChannelConfigResult)
    }

    if ('peerAddresses' in payload) {
      peerAddresses = payload.peerAddresses
    } else {
      const discoverPeersResult = await this.commitSteps().discoverPeers(payload)
      if (!('stdout' in discoverPeersResult)) {
        logger.error('this service only for docker infra')
        throw new Error('this service for docker infra')
      }
      peerAddresses = Chaincode.parser.commitStepDiscoverPeers(discoverPeersResult)
    }

    return await this.commitSteps().commitOnInstance({ ...payload, orderer, peerAddresses })
  }

  /**
   * @ignore
   */
  public commitSteps () {
    return {
      discoverPeers: async (payload: ChaincodeCommitType): Promise<InfraRunnerResultType> => {
        logger.debug('commit chaincode step 1 (discover peers)')
        return await (new Discover(this.config)).peers({ channel: payload.channelId })
      },
      discoverChannelConfig: async (payload: ChaincodeCommitType): Promise<InfraRunnerResultType> => {
        logger.debug('commit chaincode step 2 (discover channel config)')
        return await (new Discover(this.config)).channelConfig({ channel: payload.channelId })
      },
      commitOnInstance: async (payload: ChaincodeCommitStepCommitOnInstanceType): Promise<InfraRunnerResultType> => {
        logger.debug('commit chaincode step 3 (commit)')
        return await (new FabricInstance(this.config, this.infra)).commitChaincode(payload.channelId, payload.chaincodeName.replace('_', '-'), payload.chaincodeVersion, payload.initRequired, payload.orderer, payload.peerAddresses)
      },
    }
  }

  /**
   * @description 查詢已發布的chaincode
   */
  public async getCommittedChaincode (channelId: string): Promise<InfraRunnerResultType> {
    logger.debug('Get committed chaincode')
    return await (new FabricInstance(this.config, this.infra)).queryCommittedChaincode(channelId)
  }
}
