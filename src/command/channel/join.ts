import { Argv, Arguments } from 'yargs'
import Channel from '../../service/channel'
import prompts from 'prompts'
import config from '../../config'
import { onCancel } from '../../util'
import { getChannelList, getOrdererList } from '../../model/prompts/util'

export const command = 'join'

export const desc = '加入在 Blockchain network 中的 Channel'

interface OptType {
  interactive: boolean
  name: string
  orderer: string
}

const channelList = getChannelList(config)
const ordererList = getOrdererList(config)
export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk channel join --interactive', 'Cathay BDK 互動式問答')
    .example('bdk channel join --name test --orderer orderer0.example.com:7050', '使用 orderer0.example.com:7050 加入 test 名稱 Channel')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('name', { type: 'string', choices: channelList, description: '欲加入 Channel 的名稱', alias: 'n' })
    .option('orderer', { type: 'string', choices: ordererList, description: '選擇加入 Channel 使用的 Orderer' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const channel = new Channel(config)

  let joinChannelInput

  if (argv.interactive) {
    joinChannelInput = await prompts([
      {
        type: 'select',
        name: 'channelName',
        message: 'What is your channel name?',
        choices: channelList.map(x => ({
          title: x,
          value: x,
        })),
      },
      {
        type: 'select',
        name: 'orderer',
        message: 'Ordering service endpoint',
        choices: ordererList.map(x => ({
          title: x,
          value: x,
        })),
      },
    ], { onCancel })
  } else {
    const { name, orderer } = argv
    joinChannelInput = {
      channelName: name,
      orderer,
    }
  }

  await channel.join(joinChannelInput)
}
