import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Backup from '../../service/backup'
import { onCancel, ParamsError, ProcessError } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'

export const command = 'export'

export const desc = '匯出現有的 Fabric Network'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk fabric backup export --interactive', 'Cathay BDK 互動式問答')
    .example('bdk fabric backup export --all', '備份 BDK 資料夾下所有 Fabric Network 資料')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('all', { type: 'boolean', description: '是否備份所有資料', alias: 'a' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const backup = new Backup(config)

  if (argv.all) {
    const spinner = ora('Fabric Network Export All ...').start()
    await backup.exportAll()
    spinner.succeed('Fabric Network Export All Successfully!')
  } else if (argv.interactive) {
    const { option } = await prompts({
      type: 'select',
      name: 'option',
      message: 'Please specify export types.',
      choices: [
        { title: 'All', value: 'all' },
        { title: 'Seperate', value: 'separate' },
      ],
    }, { onCancel })
    if (option === 'all') {
      const spinner = ora('Fabric Network Export All ...').start()
      await backup.exportAll()
      spinner.succeed('Fabric Network Export All Successfully!')
    } else if (option === 'separate') {
      const { choice } = await prompts({
        type: 'select',
        name: 'choice',
        message: 'What do you want to export?',
        choices: [
          { title: 'Peer', value: 'peer' },
          { title: 'Orderer', value: 'orderer' },
        ],
      }, { onCancel })

      if (choice === 'peer') {
        const peer: string[] = await (async () => {
          const fileNames = backup.getDockerComposeList().peer
          const fileName = fileNames.map(x => ({ title: x, value: x }))
          if (fileNames.length !== 0) {
            return (await prompts({
              type: 'multiselect',
              name: 'peer',
              message: 'Which peer you want to export?',
              choices: fileName,
            }, { onCancel })).peer
          } else {
            throw new ProcessError('[x] [file-system error]: Peer not exist')
          }
        })()

        const spinner = ora(`Fabric Network Export ${peer} ...`).start()
        await backup.export(peer)
        spinner.succeed(`Fabric Network Export ${peer} Successfully!`)
      } else if (choice === 'orderer') {
        const orderer: string[] = await (async () => {
          const fileNames = backup.getDockerComposeList().orderer
          const fileName = fileNames.map(x => ({ title: x, value: x }))
          if (fileNames.length !== 0) {
            return (await prompts({
              type: 'multiselect',
              name: 'orderer',
              message: 'Which orderer you want to export?',
              choices: fileName,
            }, { onCancel })).orderer
          } else {
            throw new ProcessError('[x] [file-system error]: Orderer not exist')
          }
        })()

        const spinner = ora(`Fabric Network Export ${orderer} ...`).start()
        await backup.export(orderer)
        spinner.succeed(`Fabric Network Export ${orderer} Successfully!`)
      }
    }
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
