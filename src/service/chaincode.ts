import path from 'path'
import FabricTools from '../instance/fabricTools'
import FabricInstance from '../instance/fabricInstance'
import { ChaincodeApproveType, ChaincodeCommitType, ChaincodeInstallType, ChaincodeInvokeType, ChaincodePackageType, ChaincodeQueryType } from '../model/type/chaincode.type'
import { ParserType, AbstractService } from './Service.abstract'
import { logger } from '../util/logger'
import { DockerResultType, InfraRunnerResultType } from '../instance/infra/InfraRunner.interface'

interface ChaincodeParser extends ParserType {
  installToPeer: (result: DockerResultType, options: {chaincodeLabel: string}) => string
  invoke: (result: DockerResultType) => any
  query: (result: DockerResultType) => any
  getChaincodePackageId: (result: DockerResultType, options: {chaincodeLabel: string}) => string
  getCommittedChaincode: (result: DockerResultType) => string[]
}

export default class Chaincode extends AbstractService {
  static readonly parser: ChaincodeParser = {
    installToPeer: (result, options: {chaincodeLabel: string}) => result.stdout.match(RegExp(`(?<=Chaincode code package identifier: )${options.chaincodeLabel}:.*(?=\r\n$)`))?.[0] || '',
    invoke: (result) => JSON.parse(result.stdout.match(/(?<=Chaincode invoke successful. result: status:200 payload:").*(?=" \r\n)/)?.[0].replace(/\\"/g, '"') || '{}'),
    query: (result) => JSON.parse(result.stdout || '{}'),
    getChaincodePackageId: (result, options: {chaincodeLabel: string}) => result.stdout.match(RegExp(`(?<=Package ID: )${options.chaincodeLabel}:.*(?=, Label: ${options.chaincodeLabel})`))?.[0] || '',
    getCommittedChaincode: (result) => result.stdout.match(/(?<=Name: ).*(?=, Version)/g) || [],
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
  public async invoke (payload: ChaincodeInvokeType): Promise<InfraRunnerResultType> {
    logger.debug('invoke chaincode')
    return await (new FabricInstance(this.config, this.infra)).invokeChaincode(payload.channelId, payload.chaincodeName, payload.chaincodeFunction, payload.args, payload.isInit, payload.orderer, payload.peerAddresses)
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
    dto.packageId = Chaincode.parser.installToPeer(installToPeerResult, { chaincodeLabel: dto.chaincodeLabel })
    return this.installSteps().savePackageId(dto)
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
      savePackageId: (dto: ChaincodeInstallType): string => {
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
  public async approve (payload: ChaincodeApproveType): Promise<InfraRunnerResultType> {
    logger.debug('approve for my org')
    const packageId = this.bdkFile.getPackageId(`${payload.chaincodeName}_${payload.chaincodeVersion}`)
    return await (new FabricInstance(this.config, this.infra)).approveChaincode(payload.channelId, payload.chaincodeName, payload.chaincodeVersion, packageId, payload.initRequired, payload.orderer)
  }

  /**
   * @description 發布 chaincode
   */
  public async commit (payload: ChaincodeCommitType): Promise<InfraRunnerResultType> {
    logger.debug('Commit chaincode definition')
    return await (new FabricInstance(this.config, this.infra)).commitChaincode(payload.channelId, payload.chaincodeName.replace('_', '-'), payload.chaincodeVersion, payload.initRequired, payload.orderer, payload.peerAddresses)
  }

  /**
   * @description 查詢已發布的chaincode
   */
  public async getCommittedChaincode (channelId: string): Promise<InfraRunnerResultType> {
    logger.debug('Get committed chaincode')
    return await (new FabricInstance(this.config, this.infra)).queryCommittedChaincode(channelId)
  }
}
