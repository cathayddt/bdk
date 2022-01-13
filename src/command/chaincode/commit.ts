import { Arguments, Argv } from 'yargs'
import prompts from 'prompts'
import { logger, onCancel } from '../../util'
import { ChaincodeCommitType, ChaincodeCommitWithoutDiscoverType } from '../../model/type/chaincode.type'
import Chaincode from '../../service/chaincode'
import Channel from '../../service/channel'
import config from '../../config'
import { getChaincodeList, joinedChannelChoice } from '../../model/prompts/util'

export const command = 'commit'

export const desc = '代表環境變數中 BDK_ORG_NAME 的 Peer org 發布 Chaincode'

interface OptType {
  interactive: boolean
  channelId: string
  chaincodeLabel: string
  initRequired: boolean
  orderer: string
  peerAddresses: string[]
}

const chaincodeList = getChaincodeList(config)
export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk chaincode commit --interactive', 'Cathay BDK 互動式問答')
    .example('bdk chaincode commit --channel-id test --chaincode-label fabcar_1 --init-required', '使用 discover 自動選擇 peer 與 orderer 同意名稱為 test 的 channel 中標籤為 fabcar_1 的 Chaincode，此 Chaincode 需要初始化並且 Org1 和 Org2 的 Peer org 簽名')
    .example('bdk chaincode commit --channel-id test --chaincode-label fabcar_1 --init-required --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com --peer-addresses peer0.org2.example.com', '使用 orderer0.example.com:7050 同意名稱為 test 的 channel 中標籤為 fabcar_1 的 Chaincode，此 Chaincode 需要初始化並且 Org1 和 Org2 的 Peer org 簽名')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('channel-id', { type: 'string', description: '選擇欲發布 Chaincode 在的 Channel 名稱', alias: 'C' })
    .option('chaincode-label', { type: 'string', description: 'Chaincode package 的標籤名稱', alias: 'l', choices: chaincodeList.map(x => `${x.name}_${x.version}`) })
    .option('init-required', { type: 'boolean', description: 'Chaincode 是否需要初始化', alias: 'I' })
    .option('orderer', { type: 'string', description: '選擇 Orderer 同意 Chaincode (若未輸入則使用discover)' })
    .option('peer-addresses', { type: 'array', description: '需要簽名的 Peer address (若未輸入則使用discover)' })
}

export const handler = async (argv: Arguments<OptType>) => {
  logger.debug('exec chaincode deploy')

  const chaincode = new Chaincode(config)
  const channel = new Channel(config)

  let commitChannelInput: ChaincodeCommitType | ChaincodeCommitWithoutDiscoverType
  const chaincodeVersionMap: Map<string, number[]> = new Map()
  chaincodeList.forEach(chaincode => {
    chaincodeVersionMap.set(chaincode.name, [...(chaincodeVersionMap.get(chaincode.name) || []), chaincode.version])
  })
  if (argv.interactive) {
    const { channelId, chaincodeName } = await prompts([
      {
        type: 'select',
        name: 'channelId',
        message: 'Which channel do you want deploy chaincode',
        choices: await joinedChannelChoice(channel),
      },
      {
        type: 'select',
        name: 'chaincodeName',
        message: 'What is your chaincode name?',
        choices: Array.from(chaincodeVersionMap.keys()).map(x => ({
          title: x,
          value: x,
        })),
      },
    ], { onCancel })
    const { chaincodeVersion, initRequired } = await prompts([
      {
        type: 'select',
        name: 'chaincodeVersion',
        message: 'What is your chaincode version?',
        choices: (chaincodeVersionMap.get(chaincodeName) || []).sort((a, b) => (a - b)).map(x => ({
          title: x.toString(),
          value: x,
        })),
      },
      {
        type: 'select',
        name: 'initRequired',
        message: 'Whether the chaincode requires invoking \'init\'',
        choices: [
          {
            title: 'true',
            value: true,
          },
          {
            title: 'false',
            value: false,
          },
        ],

      },
    ], { onCancel })

    commitChannelInput = {
      channelId,
      chaincodeName,
      chaincodeVersion,
      initRequired,
    }

    const discoverOrderer = await prompts([
      {
        type: 'select',
        name: 'discoverOrderer',
        message: 'Set orderer with discover?',
        choices: [
          {
            title: 'Yes',
            value: true,
          },
          {
            title: 'No',
            value: false,
          },
        ],
      },
    ], { onCancel })
    if (discoverOrderer) {
      const channelGroup = await channel.getChannelGroup(channelId)
      const { orderer } = await prompts([
        {
          type: 'select',
          name: 'orderer',
          message: 'Ordering service endpoint',
          choices: channelGroup.orderer.map(x => ({
            title: x,
            value: x,
          })),
        },
      ], { onCancel })
      commitChannelInput = { ...commitChannelInput, orderer }
    }

    const discoverPeer = await prompts([
      {
        type: 'select',
        name: 'discoverPeer',
        message: 'Set peers with discover?',
        choices: [
          {
            title: 'Yes',
            value: true,
          },
          {
            title: 'No',
            value: false,
          },
        ],
      },
    ], { onCancel })
    if (discoverPeer) {
      const channelGroup = await channel.getChannelGroup(channelId)
      const { peerAddresses } = await prompts([
        {
          type: 'multiselect',
          name: 'peerAddresses',
          message: 'The addresses of the peers to connect to',
          choices: channelGroup.anchorPeer.map(x => ({
            title: x,
            value: x,
          })),
        },
      ], { onCancel })
      commitChannelInput = { ...commitChannelInput, peerAddresses }
    }
  } else {
    commitChannelInput = {
      channelId: argv.channelId,
      chaincodeName: argv.chaincodeLabel.split('_')[0],
      chaincodeVersion: parseInt(argv.chaincodeLabel.split('_')[1]),
      initRequired: argv.initRequired,
    }
    if (argv.orderer) {
      commitChannelInput = { ...commitChannelInput, orderer: argv.orderer }
    }
    if (argv.peerAddresses) {
      commitChannelInput = { ...commitChannelInput, peerAddresses: argv.peerAddresses }
    }
  }

  await chaincode.commit(commitChannelInput)
}
