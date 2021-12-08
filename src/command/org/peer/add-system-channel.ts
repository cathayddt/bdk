import config from '../../../config'
import prompts from 'prompts'
import { Arguments, Argv } from 'yargs'
import { onCancel, ParamsError } from '../../../util'
import Peer from '../../../service/peer'
import { getOrdererList } from '../../../model/prompts/util'

export const command = 'add-system-channel'

export const desc = '加入新 Peer org 在 System Channel 中'

interface OptType {
  interactive: boolean
  orderer: string
  channelName: string
  peerOrgName: string
}

const ordererList = getOrdererList(config)

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk org peer add-system-channel --interactive', 'Cathay BDK 互動式問答')
    .example('bdk org peer add-system-channel --orderer orderer0.example.com:7050 --peer-org-name Org1', '使用 orderer0.example.com:7050 將 Org1 加入 System channel')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('peer-org-name', { type: 'string', description: '欲加入 Channel 中 Peer Org 的名稱', alias: 'n' })
    .option('orderer', { type: 'string', choices: ordererList, description: '選擇使用的 Orderer', alias: 'o' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const peer = new Peer(config)

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

  await peer.addOrgToSystemChannel({ channelName: 'system-channel', orgName: peerOrgName, orderer })
}
