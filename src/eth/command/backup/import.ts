import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Backup from '../../service/backup'
import { onCancel, ParamsError } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'import'

export const desc = '匯入現有的 Eth Network'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk eth backup import --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
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

  const archive: string = await (async () => {
    const archiveList = backup.getBackupItems()
    if (argv.interactive) {
      return (await prompts({
        type: 'select',
        name: 'archive',
        message: 'Which backup file you want to import?',
        choices: archiveList,
      }, { onCancel })).archive
    } else {
      throw new ParamsError('Invalid params: Required parameter missing')
    }
  })()
  const spinner = ora(`${networkTypeWithBigFirstLetter} Network Import ...`).start()
  await backup.import(archive)
  spinner.succeed(`${networkTypeWithBigFirstLetter} Network Import Successfully!`)
}
