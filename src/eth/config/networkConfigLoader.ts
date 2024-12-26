import { GenesisJsonType } from '../model/type/network.type'
import { NetworkConfigType, NetworkType } from './network.type'
import besuMemberConfig from './besu/besuMemberConfig'
import besuValidatorConfig from './besu/besuValidatorConfig'
import quorumMemberConfig from './quorum/quorumMemberConfig'
import quorumValidatorConfig from './quorum/quorumValidatorConfig'
import quorumGenesisConfig from './quorum/quorumGenesisConfig'
import besuGenesisConfig from './besu/besuGenesisConfig'
import { NodeTypeEnum } from '../model/type/config.type'

const networkConfigs: { [key in NetworkType]: { member: NetworkConfigType; validator: NetworkConfigType; genesisJson: GenesisJsonType; ethereumJsonRpcVariant: string } } = {
  [NetworkType.BESU]: {
    member: besuMemberConfig,
    validator: besuValidatorConfig,
    genesisJson: besuGenesisConfig,
    ethereumJsonRpcVariant: 'besu',
  },
  [NetworkType.QUORUM]: {
    member: quorumMemberConfig,
    validator: quorumValidatorConfig,
    genesisJson: quorumGenesisConfig,
    ethereumJsonRpcVariant: 'geth',
  },
}

export const getNetworkConfig = (networkType: NetworkType, nodeType: NodeTypeEnum): NetworkConfigType => {
  const config = networkConfigs[networkType][nodeType]
  if (!config) {
    throw new Error(`Unsupported network type: ${networkType}`)
  }
  return config
}

export const getGenesisJson = (networkType: NetworkType): GenesisJsonType => {
  const genesisJson = networkConfigs[networkType].genesisJson
  if (!genesisJson) {
    throw new Error(`Unsupported network type: ${networkType}`)
  }
  return genesisJson
}
export const getEthereumJsonRpcVariant = (networkType: NetworkType): string => {
  const ethereumJsonRpcVariant = networkConfigs[networkType].ethereumJsonRpcVariant
  if (!ethereumJsonRpcVariant) {
    throw new Error(`Unsupported network type: ${networkType}`)
  }
  return ethereumJsonRpcVariant
}
