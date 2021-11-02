import config from '../../config'
import { Argv, Arguments } from 'yargs'
import Channel from '../../service/channel'
import prompts from 'prompts'
import { onCancel, ParamsError } from '../../util'
import { getOrdererList, joinedChannelChoice } from '../../model/prompts/util'
import { ChannelUpdateAnchorPeerType } from '../../model/type/channel.type'

export const command = 'update-anchorpeer'

export const desc = '更新在 Channel 中 Anchor peer 的資訊'

interface OptType {
  interactive: boolean
  name: string
  orderer: string
  port: number
}

const ordererList = getOrdererList(config)

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk channel update-anchorpeer --interactive', 'Cathay BDK 互動式問答')
    .example('bdk channel update-anchorpeer -n test -o orderer0.example.com:7050 -p 7051', '使用 orderer0.example.com:7050 更新 test 名稱 Channel 中 Anchor peer 資訊，此 Anchor peer 的 port 號碼為 7051')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('name', { type: 'string', description: '更新 Anchor peer 資訊在 Channel 的名稱', alias: 'n' })
    .option('orderer', { type: 'string', choices: ordererList, description: '使用 Orderer 更新在 Channel 中 Anchor peer 資訊的 Domain name 和 Port 號碼' })
    .option('port', { type: 'number', description: '更新 Peer 的 Port 號碼', alias: 'p', default: 7051 })
}

export const handler = async (argv: Arguments<OptType>) => {
  const channel = new Channel(config)

  const channelName = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'select',
          name: 'channelName',
          message: 'What is your channel name?',
          choices: await joinedChannelChoice(channel),
        },
      ], { onCancel })).channelName
    } else if (argv.name) {
      return argv.name
    } else {
      throw new ParamsError('Invalid params: Duplicate parameters <name>')
    }
  })()

  const channelGroup = await channel.getChannelGroup(channelName)

  const orderer = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'select',
          name: 'orderer',
          message: 'Ordering service endpoint',
          choices: channelGroup.orderer.map(x => ({
            title: x,
            value: x,
          })),
        },
      ], { onCancel })).orderer
    } else if (argv.orderer) {
      return argv.orderer
    } else {
      throw new ParamsError('Invalid params: Duplicate parameters <orderer>')
    }
  })()

  const port = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'number',
          name: 'port',
          message: 'What is your anchor peer port number?',
          initial: 7051,
        },
      ], { onCancel })).port
    } else if (argv.port) {
      return argv.port
    } else {
      throw new ParamsError('Invalid params: Duplicate parameters <port>')
    }
  })()

  const updateChannelInput: ChannelUpdateAnchorPeerType = {
    channelName,
    orderer,
    port,
  }

  await channel.updateAnchorPeer(updateChannelInput)
}
