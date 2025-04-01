import { Argv, Arguments } from 'yargs'
import Channel from '../../service/channel'
import prompts from 'prompts'
import config from '../../config'
import { onCancel } from '../../../util'
import { getChannelList } from '../../model/prompts/util'
import ora from 'ora'

export const command = 'snapshot'

export const des = '對channel進行快照'

export const builder = {}

interface OptType {
    interactive: boolean
    block: number
    channelName: string
    snapshotPath: string
    operation: 'submit' | 'listPending' | 'join' | 'cancel'
}

const operationChoices = [
    { title: '提交快照', value: 'submit' },
    { title: '列出待處理快照', value: 'listPending' },
    { title: '用快照加入channel', value: 'join' },
    { title: '取消快照', value: 'cancel'}
]

const channelList = getChannelList(config)

export const handler = async (argv: Arguments<OptType>) => {
    const channel = new Channel(config)
    const spinner = ora('FabricChannelSnapshot...').start()
  
    try {
      const { operation, interactive, channelName, block, snapshotPath } = argv

      if (interactive) {
        return await runInteractiveMode(channel)
      }
  
      if (!operation) {
        throw new Error('Operation type is needed!')
      }
  
      switch(operation) {
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
  
      spinner.succeed(`Fabric Channel Snapshot ${operation} successfully!`)
    } catch (error) {
      spinner.fail(`Operation failed: ${error instanceof Error ? error.message : error}`)
      process.exit(1)
    }
  }
  
  async function runInteractiveMode(channel: Channel) {
    const { operation } = await prompts({
      type: 'select',
      name: 'operation',
      message: 'Operation type',
      choices: operationChoices
    }, { onCancel })
  
    switch(operation) {
      case 'submit':
        const submitData = await prompts([
          {
            type: 'text',
            name: 'channelName',
            message: '輸入Channel名稱'
          },
          {
            type: 'number',
            name: 'blockNumber',
            message: '輸入區塊號碼',
            validate: value => value >= 0 || '不能為負數(0代表立刻快照)'
          }
        ], { onCancel })
        await channel.submitSnapshotRequest(submitData)
        break
  
      case 'list':
        const listData = await prompts({
          type: 'text',
          name: 'channelName',
          message: '輸入Channel名稱'
        }, { onCancel })
        await channel.listPendingSnapshots(listData)
        break
  
      case 'cancel':
        const cancelData = await prompts([
          {
            type: 'text',
            name: 'channelName',
            message: '輸入Channel名稱'
          },
          {
            type: 'number',
            name: 'blockNumber',
            message: '輸入區塊號碼',
            validate: value => value > 0 || '必須大於0'
          }
        ], { onCancel })
        await channel.cancelSnapshotRequest(cancelData)
        break
  
      case 'join':
        const joinData = await prompts({
          type: 'text',
          name: 'snapshotPath',
          message: '輸入Snapshot路徑'
        }, { onCancel })
        await channel.joinBySnapshot(joinData)
        break
    }
  }