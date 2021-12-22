import prompts from 'prompts'
import { Arguments, Argv } from 'yargs'
import { onCancel, ParamsError } from '../../util'
import config from '../../config'
import { getChannelEnvelopeList } from '../../model/prompts/util'
import Channel from '../../service/channel'

export const command = 'approve'

export const desc = '代表環境變數中 BDK_ORG_NAME 的 Org 同意設定檔更動並且簽章'

interface OptType {
  interactive: boolean
  channelName: string
}

const channelEnvelopeList = getChannelEnvelopeList(config)

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk channel approve --interactive', 'Cathay BDK 互動式問答')
    .example('bdk channel approve --channel-name test', '對channel test 的更動資訊簽章')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
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

  await channel.approve({ channelName })
}
