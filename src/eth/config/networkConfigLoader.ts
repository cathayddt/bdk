import { GenesisJsonType } from '../model/type/network.type'
import { NetworkConfigType, NetworkType } from './network.type'
import { NodeTypeEnum } from '../model/type/config.type'
import { GenesisConfigYaml, ValidatorConfigYaml, MemberConfigYaml } from '../model/yaml/helm-chart'
import besuMemberConfig from './besu/besuMemberConfig'
import besuValidatorConfig from './besu/besuValidatorConfig'
import quorumMemberConfig from './quorum/quorumMemberConfig'
import quorumValidatorConfig from './quorum/quorumValidatorConfig'
import quorumGenesisConfig from './quorum/quorumGenesisConfig'
import besuGenesisConfig from './besu/besuGenesisConfig'

interface ClusterConfig {
  genesisConfig: typeof GenesisConfigYaml
  validatorConfig: typeof ValidatorConfigYaml
  memberConfig: typeof MemberConfigYaml
  genesisChartPath: string
  nodeChartPath: string
  namespace: string
}

interface NetworkConfig {
  member: NetworkConfigType
  validator: NetworkConfigType
  genesisJson: GenesisJsonType
  ethereumJsonRpcVariant: string
  cluster: ClusterConfig
}

const networkConfigs: { [key in NetworkType]: NetworkConfig } = {
  [NetworkType.BESU]: {
    member: besuMemberConfig,
    validator: besuValidatorConfig,
    genesisJson: besuGenesisConfig,
    ethereumJsonRpcVariant: 'besu',
    cluster: {
      genesisConfig: GenesisConfigYaml,
      validatorConfig: ValidatorConfigYaml,
      memberConfig: MemberConfigYaml,
      genesisChartPath: 'besuGenesisChart',
      nodeChartPath: 'besuNodeChart',
      namespace: 'besu',
    },
  },
  [NetworkType.QUORUM]: {
    member: quorumMemberConfig,
    validator: quorumValidatorConfig,
    genesisJson: quorumGenesisConfig,
    ethereumJsonRpcVariant: 'geth',
    cluster: {
      genesisConfig: GenesisConfigYaml,
      validatorConfig: ValidatorConfigYaml,
      memberConfig: MemberConfigYaml,
      genesisChartPath: 'goQuorumGenesisChart',
      nodeChartPath: 'goQuorumNodeChart',
      namespace: 'quorum',
    },
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
export const getEthereumJsonRpcVariant = (networkType: NetworkType): String => {
  const ethereumJsonRpcVariant = networkConfigs[networkType].ethereumJsonRpcVariant
  if (!ethereumJsonRpcVariant) {
    throw new Error(`Unsupported network type: ${networkType}`)
  }
  return ethereumJsonRpcVariant
}

export const getClusterConfig = (networkType: NetworkType): ClusterConfig => {
  const clusterConfig = networkConfigs[networkType].cluster
  if (!clusterConfig) {
    throw new Error(`Unsupported network type: ${networkType}`)
  }
  return clusterConfig
}