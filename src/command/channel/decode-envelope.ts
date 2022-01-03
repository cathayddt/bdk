import prompts from 'prompts'
import { Arguments, Argv } from 'yargs'
import { logger, onCancel, ParamsError } from '../../util'
import config from '../../config'
import Channel from '../../service/channel'
import { getChannelEnvelopeList } from '../../model/prompts/util'
import { EnvelopeTypeEnum, EnvelopeVerifyEnum } from '../../model/type/channel.type'

export const command = 'decode-envelope'

export const desc = '解析 Approve 或 Update 的信封內容'

interface OptType {
  interactive: boolean
  channelName: string
  verify: boolean
}

const channelEnvelopeList = getChannelEnvelopeList(config)

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk channel decode-envelope --interactive', 'Cathay BDK 互動式問答')
    .example('bdk channel decode-envelope --channel-name test', '解析 channel test 的更動資訊')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('channel-name', { type: 'string', choices: channelEnvelopeList, description: 'Channel 的名稱', alias: 'c' })
    .option('verify', { type: 'boolean', description: '驗證組織內容的正確性', alias: 'V' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const channel = new Channel(config)

  const channelName: string = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'select',
          name: 'channelName',
          message: 'What is your channel name?',
          choices: channelEnvelopeList.map(x => ({
            title: x,
            value: x,
          })),
        },
      ], { onCancel })).channelName
    } else if (argv.channelName) {
      return argv.channelName
    } else {
      throw new ParamsError('Invalid params: Required parameter missing <channel-name>')
    }
  })()

  const decodeResult = (await channel.decodeEnvelope({ channelName }))
  logger.info(`Approved org: ${decodeResult.approved.toString()}`)
  switch (decodeResult.type) {
    case EnvelopeTypeEnum.ADD_PEER_TO_SYSTEM_CHANNEL:
    case EnvelopeTypeEnum.ADD_PEER_TO_APPLICATION_CHANNEL:
      logger.info(`Add peer org "${decodeResult.org}" into channel`)
      logger.info(`Verify: ${decodeResult.verify}`)
      if (argv.verify && decodeResult.verify !== EnvelopeVerifyEnum.VERIFIED) {
        process.exit(255)
      }
      break
    case EnvelopeTypeEnum.ADD_ORDERER_TO_CHANNEL:
      logger.info(`Add orderer org "${decodeResult.org}" into channel`)
      logger.info(`Verify: ${decodeResult.verify}`)
      if (argv.verify && decodeResult.verify !== EnvelopeVerifyEnum.VERIFIED) {
        process.exit(255)
      }
      break
    case EnvelopeTypeEnum.UPDATE_ANCHOR_PEER:
      logger.info(`Update anchor peer of peer org "${decodeResult.org}": ${decodeResult.anchorPeers}`)
      break
    case EnvelopeTypeEnum.ADD_ORDERER_CONSENTER:
      logger.info(`Update consenter: ${decodeResult.consensus}`)
      break
    default:
      break
  }
}
