import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Network from '../../service/network'
import { onCancel, ParamsError, ProcessError } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'up'

export const desc = '啟動現有的 Quorum Network'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum network up --interactive', 'Cathay BDK 互動式問答')
    .example('bdk quorum network up --all', '啟動 BDK 資料夾下現有的 Quorum Network')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('all', { type: 'boolean', description: '是否啟動所有節點', alias: 'a' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const { networkType } = await prompts([
    {
      type: 'select',
      name: 'networkType',
      message: 'What is your network?',
      choices: getNetworkTypeChoices(),
    },
  ])
  const networkTypeWithBigFirstLetter = networkType.charAt(0).toUpperCase() + networkType.slice(1)
  const network = new Network(config, networkType)

  if (argv.all) {
    const spinner = ora(`${networkTypeWithBigFirstLetter} Network Up All ...`).start()
    await network.upAll()
    spinner.succeed(`${networkTypeWithBigFirstLetter} Network Up All Successfully!`)
  } else if (argv.interactive) {
    const node: string = await (async () => {
      const nodeList = network.getUpExportItems()

      if (nodeList.length !== 0) {
        return (await prompts({
          type: 'select',
          name: 'node',
          message: 'Which node you want to up?',
          choices: nodeList,
        }, { onCancel })).node
      } else {
        throw new ProcessError('[x] [file-system error]: Node not exist')
      }
    })()

    const spinner = ora(`${networkTypeWithBigFirstLetter} Network Up ${node} ...`).start()
    await network.upService(node)
    spinner.succeed(`${networkTypeWithBigFirstLetter} Network Up ${node} Successfully!`)
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
