import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Backup from '../../service/backup'
import { ParamsError } from '../../../util/error'
import ora from 'ora'

export const command = 'export'

export const desc = '匯出現有的 Fabric Network'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk fabric backup export --all', '備份 BDK 資料夾下所有 Fabric Network 資料')
    .option('all', { type: 'boolean', description: '是否備份所有資料', alias: 'a' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const backup = new Backup(config)

  if (argv.all) {
    const spinner = ora('Fabric Network Export All ...').start()
    await backup.exportAll()
    spinner.succeed('Fabric Network Export All Successfully!')
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
