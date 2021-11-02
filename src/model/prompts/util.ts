import fs from 'fs'
import { Choice } from 'prompts'
import Channel from '../../service/channel'
import { Config } from '../../config'
import Chaincode from '../../service/chaincode'
import { logger } from '../../util'
import { ConfigtxOrgs } from '../yaml/network/configtx'

export const joinedChannelChoice = async (channel: Channel): Promise<Choice[]> => {
  const listJoinedChannelResult = await channel.listJoinedChannel()
  if (!('stdout' in listJoinedChannelResult)) {
    logger.error('command only for docker infra')
    throw new Error('command only for docker infra')
  }
  const parsedListJoinedChannelResult = Channel.parser.listJoinedChannel(listJoinedChannelResult)
  return parsedListJoinedChannelResult.map(x => ({
    title: x,
    value: x,
  }))
}

export const committedChaincodeChoice = async (channelId: string, chaincode: Chaincode): Promise<Choice[]> => {
  const listCommittedChaincodeResult = await chaincode.getCommittedChaincode(channelId)
  if (!('stdout' in listCommittedChaincodeResult)) {
    logger.error('command only for docker infra')
    throw new Error('command only for docker infra')
  }
  const parsedListCommittedChaincodeResult = Chaincode.parser.getCommittedChaincode(listCommittedChaincodeResult)
  return parsedListCommittedChaincodeResult.map(x => ({
    title: x,
    value: x,
  }))
}

export const getChaincodeList = (config: Config): {name: string; version: number}[] => {
  const hostBasePath = `${config.infraConfig.bdkPath}/${config.networkName}`
  return fs.existsSync(`${hostBasePath}/chaincode`)
    ? (fs.readdirSync(`${hostBasePath}/chaincode`)
      .filter(x => /^.*_\d*\.tar.gz$/.test(x))
      .map(x => ({
        name: x.split('_')[0],
        version: parseInt(x.split('_')[1].split('.')[0], 10),
      })))
    : []
}

const getConfigtxOrgsJson = (config: Config): ConfigtxOrgs => {
  const hostBasePath = `${config.infraConfig.bdkPath}/${config.networkName}`
  return fs.existsSync(`${hostBasePath}/config-yaml/configtxOrgs.json`) ? JSON.parse(fs.readFileSync(`${hostBasePath}/config-yaml/configtxOrgs.json`).toString()) : { ordererOrgs: {}, peerOrgs: {} }
}
export const getOrdererList = (config: Config): string[] => {
  const configtxOrgsJson = getConfigtxOrgsJson(config)
  return Object.values(configtxOrgsJson.ordererOrgs).map(x => x.OrdererEndpoints).reduce((prev, curr) => (prev.concat(curr)), [])
}

export const getChannelList = (config: Config): string[] => {
  const hostBasePath = `${config.infraConfig.bdkPath}/${config.networkName}`
  return fs.readdirSync(`${hostBasePath}/config-yaml`).filter(x => /Channel$/.test(x)).map(x => x.replace(/Channel$/, ''))
}

export const getOrgNames = (config: Config): string[] => {
  const configtxOrgsJson = getConfigtxOrgsJson(config)
  return Object.keys(configtxOrgsJson.peerOrgs)
}
