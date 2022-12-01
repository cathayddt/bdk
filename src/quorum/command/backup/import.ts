import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Backup from '../../service/backup'
import { logger } from '../../../util'
import { onCancel, ParamsError } from '../../../util/error'
import prompts from 'prompts'

export const command = 'import'

export const desc = '匯入現有的 Quorum Network.'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum backup import --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const backup = new Backup(config)

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

  await backup.import(archive)
  logger.info('Quorum Network import Successfully!')
}
