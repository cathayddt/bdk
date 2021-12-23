import config from '../../config'
import prompts from 'prompts'
import { Arguments, Argv } from 'yargs'
import { onCancel, ParamsError } from '../../util'
import { getChannelEnvelopeList, getOrdererList } from '../../model/prompts/util'
import Channel from '../../service/channel'

export const command = 'update'

export const desc = '更新 Channel 的設定檔'

interface OptType {
  interactive: boolean
  orderer: string
  channelName: string
}

const channelEnvelopeList = getChannelEnvelopeList(config)
const ordererList = getOrdererList(config)

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk channel update --interactive', 'Cathay BDK 互動式問答')
    .example('bdk channel update --orderer orderer0.example.com:7050 --channel-name test', '使用 orderer0.example.com:7050 在名稱 test 的 channel 更新')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('orderer', { type: 'string', choices: ordererList, description: '選擇使用的 Orderer', alias: 'o' })
    .option('channel-name', { type: 'string', choices: channelEnvelopeList, description: 'Channel 的名稱', alias: 'c' })
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

  const orderer: string = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'select',
          name: 'orderer',
          message: 'Ordering service endpoint',
          choices: ordererList.map(x => ({
            title: x,
            value: x,
          })),
        },
      ], { onCancel })).orderer
    } else if (argv.orderer) {
      return argv.orderer
    } else {
      throw new ParamsError('Invalid params: Required parameter <orderer> missing')
    }
  })()

  await channel.update({ orderer, channelName })
}
