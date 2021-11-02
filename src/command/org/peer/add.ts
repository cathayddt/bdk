import config from '../../../config'
import prompts from 'prompts'
import { Arguments, Argv } from 'yargs'
import { onCancel, ParamsError } from '../../../util'
import Peer from '../../../service/peer'
import { getChannelList } from '../../../model/prompts/util'

export const command = 'add'

export const desc = '加入新 Peer org 在 Channel 中'

interface OptType {
  interactive: boolean
  orderer: string
  channelName: string
  peerOrgName: string
}

const channelList = getChannelList(config)

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk org peer add --interactive', 'Cathay BDK 互動式問答')
    .example('bdk org peer add --channel-name test --peer-org-name Org1', '將 Org1 加入 test 名稱的 Channel')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('channel-name', { type: 'string', description: 'Peer Org 加入 Channel 的名稱', alias: 'c' })
    .option('peer-org-name', { type: 'string', description: '欲加入 Channel 中 Peer Org 的名稱', alias: 'n' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const peer = new Peer(config)

  const channelName: string = await (async () => {
    if (!channelList.length) throw new ParamsError('Invalid params: Please create blockchain network first')

    if (argv.interactive) {
      return (await prompts([
        {
          type: 'select',
          name: 'channelName',
          message: 'What is your channel name?',
          choices: channelList.map(x => ({
            title: x,
            value: x,
          })),
        },
      ], { onCancel })).channelName
    } else if (argv.channelName) {
      return argv.channelName
    } else {
      throw new ParamsError('Invalid params: Required parameter <channel-name> missing')
    }
  })()

  const peerOrgName: string = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'text',
          name: 'name',
          message: 'What is peer org name?',
          initial: 'Test',
        },
      ], { onCancel })).name
    } else if (argv.peerOrgName) {
      return argv.peerOrgName
    } else {
      throw new ParamsError('Invalid params: Required parameter <peer-org-name> missing')
    }
  })()

  await peer.addOrgToChannel({ channelName, orgName: peerOrgName })
}
