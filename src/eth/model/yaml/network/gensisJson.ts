import BdkYaml from '../bdkYaml'
import { GenesisJsonType } from '../../type/network.type'
import { NetworkType } from '../../../config/network.type'
import { getGenesisJson } from '../../../config/networkConfigLoader'
class GenesisJsonYaml extends BdkYaml<GenesisJsonType> {
  constructor (type: NetworkType, value?: GenesisJsonType) {
    // Default values for quorum and besu nodes

    super(value || getGenesisJson(type))
  }

  public addExtraData (extraData: string) {
    this.value.extraData = extraData
  }

  public addChainId (chainId: number) {
    this.value.config.chainId = chainId
  }

  public addAlloc (alloc: { [address: string]: { balance: string } }) {
    this.value.alloc = alloc
  }

  public addGasLimit (gasLimit: string) {
    this.value.gasLimit = gasLimit
  }
}

export default GenesisJsonYaml
