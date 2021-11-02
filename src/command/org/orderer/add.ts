
import config from '../../../config'
import prompts from 'prompts'
import { Arguments, Argv } from 'yargs'
import { onCancel, ParamsError } from '../../../util'
import Orderer from '../../../service/orderer'
import { getChannelList, getOrdererList } from '../../../model/prompts/util'

export const command = 'add'

export const desc = '加入新 Orderer org 在 Channel 中'

interface OptType {
  interactive: boolean
  orderer: string
  channelName: string
  orgName: string
}

const channelList = getChannelList(config).concat('system-channel')
const ordererList = getOrdererList(config)

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk org orderer add org --interactive', 'Cathay BDK 互動式問答')
    .example('bdk org orderer add org --orderer orderer0.example.com:7050 -channel-name test --org-name OrdererOrg3', '使用 orderer0.example.com:7050 的 Orderer 將 OrdererOrg3 的設定檔資訊加入 Channel 名稱為 test中')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('orderer', { type: 'string', choices: ordererList, description: '選擇使用的 Orderer', alias: 'o' })
    .option('channel-name', { type: 'string', choices: channelList, description: 'Orderer Org 加入 Channel 的名稱', alias: 'c' })
    .option('org-name', { type: 'string', description: '欲加入 Channel 中 Orderer Org 的名稱', alias: 'n' })
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

  const orgName: string = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'text',
          name: 'name',
          message: 'What is orderer org name?',
          initial: 'Test',
        },
      ], { onCancel })).name
    } else if (argv.orgName) {
      return argv.orgName
    } else {
      throw new ParamsError('Invalid params: Required parameter <org-name> missing')
    }
  })()

  await ordererService.addOrgToChannel({ orderer, channelName, orgName })
}
