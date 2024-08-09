import dotenv from 'dotenv'
import os from 'os'
import { EnvironmentEnum, NodeTypeEnum } from './model/type/config.type'
import { NetworkType } from './config/network.type'

const bdkPath = process.env.BDK_PATH || `${process.env.HOME}/.bdk/eth`
dotenv.config({ path: `${bdkPath}/.env` })

/**
 * bdkPath: .bdk folder path which save all fabric files
 * dockerHostPath: Mount docker host path
 * dockerPath: Mount docker container path
 */
interface InfraConfig {
  bdkPath: string
  dockerHostPath: string
  dockerPath: string
}

export interface Config {
  environment: EnvironmentEnum
  isDevMode: boolean
  isTestMode: boolean
  isSillyMode: boolean
  infraConfig: InfraConfig
  networkName: string
  nodeType: NodeTypeEnum
  networkType: NetworkType
  hostname: string
  UID: number
  GID: number
}

const environment = (() => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return EnvironmentEnum.development
    case 'testing':
      return EnvironmentEnum.testing
    default:
      return EnvironmentEnum.production
  }
})()

const nodeType = (() => {
  switch (process.env.BDK_ETH_NODE_TYPE) {
    case 'validator':
      return NodeTypeEnum.VALIDATOR
    default:
      return NodeTypeEnum.MEMBER
  }
})()

const getNetworkType = (): NetworkType => {
  switch (process.env.BDK_ETH_NETWORK_TYPE?.toLowerCase()) {
    case 'besu':
      return NetworkType.BESU
    case 'quorum':
      return NetworkType.QUORUM
    default:
      return NetworkType.QUORUM // Default to Quorum if not specified
  }
}

const isDevMode = environment === EnvironmentEnum.development
const isTestMode = environment === EnvironmentEnum.testing

const config: Config = {
  environment: environment,
  isDevMode: isDevMode,
  isTestMode: isTestMode,
  isSillyMode: (process.env.LOGGER_SILLY?.toLowerCase() === 'true') || false,
  infraConfig: {
    bdkPath: bdkPath,
    dockerHostPath: process.env.BDK_DOCKER_HOST_PATH || bdkPath,
    dockerPath: '/tmp',
  },
  networkName: '',
  nodeType: nodeType,
  networkType: NetworkType.QUORUM,
  hostname: process.env.BDK_HOSTNAME || '',
  UID: process.env.UID === undefined ? os.userInfo().uid : parseInt(process.env.UID, 10),
  GID: process.env.GID === undefined ? os.userInfo().gid : parseInt(process.env.GID, 10),
}

export default config

export function setNetwork(networkType: NetworkType) {
  config.networkType = networkType;
  config.networkName = `bdk-${networkType.toLowerCase()}-network`;
}