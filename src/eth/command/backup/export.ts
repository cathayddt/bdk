import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Backup from '../../service/backup'
import { onCancel, ParamsError, ProcessError } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'export'

export const desc = '匯出現有的 Eth Network'


interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk eth backup export --interactive', 'Cathay BDK 互動式問答')
    .example('bdk eth backup export --all', '備份所選 BDK 資料夾下所有 Eth Network 資料')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('all', { type: 'boolean', description: '是否備份所有資料', alias: 'a' })
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
  const backup = new Backup(config, networkType)

  if (argv.all) {
    const spinner = ora(`${networkTypeWithBigFirstLetter} Network Export All ...`).start()
    await backup.exportAll()
    spinner.succeed(`${networkTypeWithBigFirstLetter} Network Export All Successfully!`)
  } else if (argv.interactive) {
    const node: string = await (async () => {
      const nodeList = backup.getExportItems()
      if (nodeList.length !== 0) {
        return (await prompts({
          type: 'select',
          name: 'node',
          message: 'Which node you want to export?',
          choices: nodeList,
        }, { onCancel })).node
      } else {
        throw new ProcessError('[x] [file-system error]: Node not exist')
      }
    })()

    const spinner = ora(`${networkTypeWithBigFirstLetter} Network Export ${node} ...`).start()
    await backup.export(node)
    spinner.succeed(`${networkTypeWithBigFirstLetter} Network Export ${node} Successfully!`)
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
