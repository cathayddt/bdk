import { Argv, Arguments } from 'yargs'
import Explorer from '../../service/explorer'
import { onCancel } from '../../../util/error'
import config from '../../config'
import prompts from 'prompts'
import ora from 'ora'
import { ExplorerCreateType } from '../../model/type/explorer.type'
import Backup from '../../service/backup'

export const command = 'create'

export const desc = '產生 Quorum Explorer 所需的相關設定檔案'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum network create --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const explorer = new Explorer(config, 'quorum')
  const backup = new Backup(config, 'quorum')

  const getBackupItems = backup.getExportItems()
  const explorerCreate: ExplorerCreateType = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'select',
          name: 'httpModeEnabled',
          message: 'What is the connect mode you want?',
          choices: [
            {
              title: 'ipc mode',
              value: false,
            },
            {
              title: 'http mode',
              value: true,
            },
          ],
          initial: 0,
        },
        {
          type: 'select',
          name: 'nodeName',
          message: 'What is the host node of quorum explorer?',
          choices: getBackupItems,
          initial: 0,
        },
        {
          type: 'number',
          name: 'port',
          message: 'What is the port of quorum explorer?',
          min: 0,
          max: 65535,
          initial: 26000,
        },
      ], { onCancel })) as ExplorerCreateType
    } else {
      return {
        httpModeEnabled: false,
        nodeName: getBackupItems[0].value,
        port: 26000,
      }
    }
  })()

  const spinner = ora('Quorum Explorer Create ...').start()
  await explorer.create(explorerCreate)
  spinner.succeed(`Quorum Explorer Create Successfully! Host at: http://localhost:${explorerCreate.port}`)
}
