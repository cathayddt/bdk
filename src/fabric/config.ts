import dotenv from 'dotenv'
import os from 'os'
import { ConfigEnvType, EnvironmentEnum, OrgTypeEnum } from './model/type/config.type'

const bdkPath = process.env.BDK_PATH || `${process.env.HOME}/.bdk`
dotenv.config({ path: `${bdkPath}/.env` })

export const defaultEnv: ConfigEnvType = {
  NODE_ENV: EnvironmentEnum.production,
  BDK_NETWORK_NAME: 'bdk-network',
  BDK_ORG_TYPE: 'peer',
  BDK_ORG_NAME: 'Org1',
  BDK_ORG_DOMAIN: 'org1.example.com',
  BDK_HOSTNAME: 'peer0',
  LOGGER_SILLY: false,
}

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

interface FabricVersionConfig {
  orderer: string
  peer: string
  tools: string
  ca: string
  explorer: string
  explorerDb: string
}

export interface Config {
  environment: EnvironmentEnum
  isDevMode: boolean
  isTestMode: boolean
  isSillyMode: boolean
  infraConfig: InfraConfig
  networkName: string
  orgName: string
  orgType: OrgTypeEnum
  orgDomainName: string
  hostname: string
  fabricVersion: FabricVersionConfig
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

const orgType = (() => {
  switch (process.env.BDK_ORG_TYPE) {
    case 'orderer':
      return OrgTypeEnum.ORDERER
    default:
      return OrgTypeEnum.PEER
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
  networkName: process.env.BDK_NETWORK_NAME || 'bdk-network',
  orgType: orgType,
  orgName: process.env.BDK_ORG_NAME || '',
  orgDomainName: process.env.BDK_ORG_DOMAIN || '',
  hostname: process.env.BDK_HOSTNAME || '',
  fabricVersion: {
    orderer: process.env.FABRIC_ORDERER_VERSION || '2.2.1',
    peer: process.env.FABRIC_PEER_VERSION || '2.2.1',
    tools: process.env.FABRIC_TOOLS_VERSION || '2.2.1',
    ca: process.env.FABRIC_CA_VERSION || '1.5.0',
    explorer: '1.1.3',
    explorerDb: '1.1.3',
  },
  UID: process.env.UID === undefined ? os.userInfo().uid : parseInt(process.env.UID, 10),
  GID: process.env.GID === undefined ? os.userInfo().gid : parseInt(process.env.GID, 10),
}

export default config
