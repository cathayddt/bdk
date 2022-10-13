import dotenv from 'dotenv'
import os from 'os'
import { ConfigEnvType, EnvironmentEnum, NodeTypeEnum } from './model/type/config.type'

const bdkPath = process.env.BDK_PATH || `${process.env.HOME}/.bdk/quorum`
dotenv.config({ path: `${bdkPath}/.env` })

// export const defaultEnv: ConfigEnvType = {
//   NODE_ENV: EnvironmentEnum.production,
//   BDK_QUORUM_NETWORK_NAME: 'bdk-quorum-network',
//   BDK_ORG_TYPE: 'peer',
//   BDK_ORG_NAME: 'Org1',
//   BDK_ORG_DOMAIN: 'org1.example.com',
//   BDK_HOSTNAME: 'peer0',
//   LOGGER_SILLY: false,
// }

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
  switch (process.env.BDK_QUORUM_NODE_TYPE) {
    case 'validator':
      return NodeTypeEnum.VALIDATOR
    default:
      return NodeTypeEnum.MEMBER
  }
})()

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
  networkName: process.env.BDK_QUORUM_NETWORK_NAME || 'bdk-quorum-network',
  nodeType: nodeType,
  hostname: process.env.BDK_HOSTNAME || '',
  UID: process.env.UID === undefined ? os.userInfo().uid : parseInt(process.env.UID, 10),
  GID: process.env.GID === undefined ? os.userInfo().gid : parseInt(process.env.GID, 10),
}

export default config
