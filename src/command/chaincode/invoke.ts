import { Argv, Arguments } from 'yargs'
import prompts from 'prompts'
import { logger, onCancel } from '../../util'
import { ChaincodeInvokeType, ChaincodeInvokeWithoutDiscoverType } from '../../model/type/chaincode.type'
import Channel from '../../service/channel'
import Chaincode from '../../service/chaincode'
import { committedChaincodeChoice, joinedChannelChoice } from '../../model/prompts/util'
import config from '../../config'

export const command = 'invoke'

export const desc = '執行 Chaincode function'

interface OptType {
  interactive: boolean
  channelId: string
  chaincodeName: string
  isInit: boolean
  chaincodeFunction: string
  args?: any[]
  orderer: string
  peerAddresses: string[]
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk chaincode invoke --interactive', 'Cathay BDK 互動式問答')
    .example('bdk chaincode invoke --channel-id fabcar --chaincode-name fabcar --is-init --chaincode-function InitLedger', '使用名稱為 InitLedger 的 function 初始化名稱為 fabcar 的 Chaincode，使用 discover 決定 orderer 與 peer')
    .example('bdk chaincode invoke --channel-id fabcar --chaincode-name fabcar --is-init --chaincode-function InitLedger --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:8051', '使用 orderer0.example.com:7050 和名稱為 InitLedger 的 function 初始化名稱為 fabcar 的 Chaincode，需要名稱為 Org1 和 Org2 的 Peer Org 簽名')
    .example('bdk chaincode invoke --channel-id fabcar --chaincode-name fabcar --chaincode-function CreateCar -a CAR_ORG1_PEER0 -a BMW -a X6 -a blue -a Org1 --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:8051', '使用 orderer0.example.com:7050 名稱為 fabcar 的 Chaincode 執行 CreateCar 的 function，需要 CAR_ORG1_PEER0、BMW、X6、blue、Org1 的參數和名稱為 Org1 和 Org2 的 Peer Org 簽名')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('channel-id', { type: 'string', description: '選擇欲執行 Chaincode 在的 Channel 名稱', alias: 'C' })
    .option('chaincode-name', { type: 'string', description: '欲執行 Chaincode 的名稱', alias: 'n' })
    .option('is-init', { type: 'boolean', description: '是否要初始化 Chaincode', alias: 'I', default: false })
    .option('chaincode-function', { type: 'string', description: '執行 Chaincode 的 function', alias: 'f' })
    .option('args', { type: 'array', description: '執行 Chaincode 需要的參數', alias: 'a' })
    .option('orderer', { type: 'string', description: '選擇 Orderer 執行 Chaincode (若未輸入則使用discover)' })
    .option('peer-addresses', { type: 'array', description: '需要簽名的 Peer address (若未輸入則使用discover)' })
}

export const handler = async (argv: Arguments<OptType>) => {
  logger.debug('exec chaincode invoke')

  const chaincode = new Chaincode(config)
  const channel = new Channel(config)

  let invokeChannelInput: ChaincodeInvokeType | ChaincodeInvokeWithoutDiscoverType
  if (argv.interactive) {
    const { channelId } = await prompts([
      {
        type: 'select',
        name: 'channelId',
        message: 'Which channel do you want invoke chaincode',
        choices: await joinedChannelChoice(channel),
      },
    ], { onCancel })

    const { chaincodeName, chaincodeFunction, args, isInit } = await prompts([
      {
        type: 'select',
        name: 'chaincodeName',
        message: 'What is your chaincode name?',
        choices: await committedChaincodeChoice(channelId, chaincode),
      },
      {
        type: 'text',
        name: 'chaincodeFunction',
        message: 'What is your chaincode function?',
      },
      {
        type: 'list',
        name: 'args',
        message: 'What is your args?',
      },
      {
        type: 'select',
        name: 'isInit',
        message: 'Is this invocation for init?',
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
        initial: 1,
      },
    ])
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

    invokeChannelInput = { channelId, chaincodeName, chaincodeFunction, args, isInit }

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
      invokeChannelInput = { ...invokeChannelInput, orderer }
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
      invokeChannelInput = { ...invokeChannelInput, peerAddresses }
    }
  } else {
    invokeChannelInput = {
      channelId: argv.channelId,
      chaincodeName: argv.chaincodeName,
      chaincodeFunction: argv.chaincodeFunction,
      args: argv.args || [],
      isInit: argv.isInit,
    }
    if (argv.orderer) {
      invokeChannelInput = { ...invokeChannelInput, orderer: argv.orderer }
    }
    if (argv.peerAddresses) {
      invokeChannelInput = { ...invokeChannelInput, peerAddresses: argv.peerAddresses }
    }
  }

  const invokeResult = await chaincode.invoke(invokeChannelInput)
  if (!('stdout' in invokeResult)) {
    throw new Error('command only for docker infra')
  }
  logger.info(`${JSON.stringify(Chaincode.parser.invoke(invokeResult))}`)
}
