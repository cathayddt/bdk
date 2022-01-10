import { ParserType, AbstractService } from './Service.abstract'
import { DiscoverChaincodeEndorsersResultType, DiscoverChaincodeEndorsersType, DiscoverChannelConfigResultType, DiscoverChannelConfigType, DiscoverPeersResultType, DiscoverPeersType } from '../model/type/discover.type'
import FabricTools from '../instance/fabricTools'
import { DockerResultType } from '../instance/infra/InfraRunner.interface'
import { randomFromArray } from '../util/utils'

interface DiscoverParser extends ParserType {
  peers: (dockerResult: DockerResultType) => DiscoverPeersResultType
  channelConfig: (dockerResult: DockerResultType) => DiscoverChannelConfigResultType
  chaincodeEndorsers: (dockerResult: DockerResultType) => DiscoverChaincodeEndorsersResultType
}

export default class Discover extends AbstractService {
  static readonly parser: DiscoverParser = {
    peers: (result) => JSON.parse(result.stdout),
    channelConfig: (result) => JSON.parse(result.stdout),
    chaincodeEndorsers: (result) => JSON.parse(result.stdout),
  }

  public async peers (payload: DiscoverPeersType) {
    return await (new FabricTools(this.config, this.infra)).discoverPeers(payload.channel)
  }

  public async channelConfig (payload: DiscoverChannelConfigType) {
    return await (new FabricTools(this.config, this.infra)).discoverChannelConfig(payload.channel)
  }

  public async chaincodeEndorsers (payload: DiscoverChaincodeEndorsersType) {
    return await (new FabricTools(this.config, this.infra)).discoverChaincodeEndorsers(payload.channel, payload.chaincode)
  }

  public static chooseOneRandomOrderer (result: DiscoverChannelConfigResultType): string {
    const orderers: string[] = []
    Object.values(result.orderers).forEach((ordererOrg) => {
      ordererOrg.endpoint.forEach(orderer => {
        orderers.push(`${orderer.host}:${orderer.port}`)
      })
    })
    return randomFromArray(orderers) // choose a random orderer
  }
}
