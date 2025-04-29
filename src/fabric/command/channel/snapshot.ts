import { Argv, Arguments } from 'yargs'
import Channel from '../../service/channel'
import prompts from 'prompts'
import config from '../../config'
import { onCancel } from '../../../util'
import { getChannelList } from '../../model/prompts/util'
// import ora from 'ora'
// import { stdout } from 'node:process'

export const command = 'snapshot'

export const des = '對channel進行快照'

const channelList = getChannelList(config)
const operations = ['submit', 'listPending', 'join', 'cancel']

interface OptType {
  interactive: boolean
  block: number
  channelName: string
  snapshotPath: string
  operation: string
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('block', { type: 'number', description: '欲提交或取消的快照區塊號碼', alias: 'b' })
    .option('channelName', { type: 'string', choices: channelList, description: '欲快照的 Channel 名稱', alias: 'c' })
    .option('snapshotPath', { type: 'string', description: '欲使用的快照路徑', alias: 'p' })
    .option('operation', { type: 'string', choices: operations, description: '欲加入 Channel 的名稱', alias: 'o' })
}

const operationChoices = [
  { title: 'submitRequest', value: 'submit' },
  { title: 'listPending', value: 'listPending' },
  { title: 'joinBySnapshot', value: 'join' },
  { title: 'cancelRequest', value: 'cancel' },
]

export const handler = async (argv: Arguments<OptType>) => {
  const channel = new Channel(config)
  // const spinner = ora('FabricChannelSnapshot...').start()
  try {
    const { operation, interactive, channelName, block, snapshotPath } = argv

    if (interactive) {
      return await runInteractiveMode(channel)
    }
    if (!operation) {
      throw new Error('Operation type is needed!')
    }
    switch (operation) {
      case 'submit':
        if (!channelName || !block) {
          throw new Error('Channel name and block number are needed!')
        }
        await channel.submitSnapshotRequest({ channelName: channelName, blockNumber: block })
        break
      case 'listPending':
        if (!channelName) {
          throw new Error('Channel name is needed!')
        }
        await channel.listPendingSnapshots({ channelName: channelName })
        break
      case 'cancel':
        if (!channelName || !block) {
          throw new Error('Channel name and block name are needed!')
        }
        await channel.cancelSnapshotRequest({ channelName: channelName, blockNumber: block })
        break
      case 'join':
        if (!snapshotPath) {
          throw new Error('Snapshot path is needed!')
        }
        await channel.joinBySnapshot({ snapshotPath: snapshotPath })
        break
      default:
        throw new Error('Unknown Operation Type!')
    }
    // spinner.succeed(`Fabric Channel Snapshot ${operation} successfully!`)
  } catch (error) {
    console.log(error)
    // spinner.fail(`Operation failed: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
}

async function runInteractiveMode (channel: Channel) {
  const { operation } = await prompts({
    type: 'select',
    name: 'operation',
    message: 'Operation type',
    choices: operationChoices,
  }, { onCancel })

  switch (operation) {
    case 'submit': {
      const submitData = await prompts([
        {
          type: 'text',
          name: 'channelName',
          message: '輸入Channel名稱',
        },
        {
          type: 'number',
          name: 'blockNumber',
          message: '輸入區塊號碼',
        },
      ], { onCancel })
      const submitResult = await channel.submitSnapshotRequest(submitData)
      console.log('stdout' in submitResult ? submitResult.stdout.replace(/\r\n/g, '') : '')
      break
    }
    case 'listPending': {
      const listData = await prompts({
        type: 'text',
        name: 'channelName',
        message: '輸入Channel名稱',
      }, { onCancel })
      const listResult = await channel.listPendingSnapshots(listData)
      console.log('stdout' in listResult ? listResult.stdout.replace(/\r\n/g, '') : '')
      break
    }
    case 'cancel': {
      const cancelData = await prompts([
        {
          type: 'text',
          name: 'channelName',
          message: '輸入Channel名稱',
        },
        {
          type: 'number',
          name: 'blockNumber',
          message: '輸入區塊號碼',
          // validate: value => value > 0 || '必須大於0'
        },
      ], { onCancel })
      const cancelResult = await channel.cancelSnapshotRequest(cancelData)
      console.log('stdout' in cancelResult ? cancelResult.stdout.replace(/\r\n/g, '') : '')
      break
    }
    case 'join': {
      const joinData = await prompts({
        type: 'text',
        name: 'snapshotPath',
        message: '輸入Snapshot路徑',
      }, { onCancel })
      const joinResult = await channel.joinBySnapshot(joinData)
      console.log('stdout' in joinResult ? joinResult.stdout.replace(/\r\n/g, '') : '')
      break
    }
  }
}
