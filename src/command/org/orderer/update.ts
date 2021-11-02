import config from '../../../config'
import prompts from 'prompts'
import { Arguments, Argv } from 'yargs'
import { onCancel, ParamsError } from '../../../util'
import Orderer from '../../../service/orderer'
import { getChannelList, getOrdererList } from '../../../model/prompts/util'

export const command = 'update'

export const desc = '更新 Channel 的設定檔'

interface OptType {
  interactive: boolean
  orderer: string
  channelName: string
}

const channelList = getChannelList(config).concat('system-channel')
const ordererList = getOrdererList(config)

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk org orderer update --interactive', 'Cathay BDK 互動式問答')
    .example('bdk org orderer update --orderer orderer0.example.com:7050 --channel-name test', '使用 orderer0.example.com:7050 在名稱 test 的 channel 更新')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('orderer', { type: 'string', choices: ordererList, description: '選擇使用的 Orderer', alias: 'o' })
    .option('channel-name', { type: 'string', choices: channelList, description: 'Channel 的名稱', alias: 'c' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const ordererService = new Orderer(config)
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

  const channelName: string = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'text',
          name: 'channelName',
          message: 'What is your channel name?',
          initial: 1,
        },
      ], { onCancel })).channelName
    } else if (argv.channelName) {
      return argv.channelName
    } else {
      throw new ParamsError('Invalid params: Required parameter missing <channel-name>')
    }
  })()

  await ordererService.update({ orderer, channelName })
}
