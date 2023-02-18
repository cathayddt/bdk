import prompts from 'prompts'
import { Argv, Arguments } from 'yargs'
import Network from '../../service/network'
import { onCancel, ParamsError } from '../../../util/error'
import { NetworkGenerateType } from '../../model/type/network.type'
import config from '../../config'
import ora from 'ora'

export const command = 'generate'

export const desc = '產生 Quorum network 所需的相關設定檔案'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum network generate --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const network = new Network(config)
  // check bdkPath files exist or not (include useless file e.g. .DS_Store)
  const confirm: boolean = await (async () => {
    network.createBdkFolder()
    const fileList = network.getBdkFiles()
    if (fileList.length !== 0) {
      const confirmDelete = (await prompts({
        type: 'confirm',
        name: 'value',
        message: '⚠️ Detecting quorum nodes already exists. The following processes will remove all existing files. Continue?',
        initial: false,
      }, { onCancel })).value
      if (confirmDelete) {
        const spinner = ora('Quorum Network Generate ...').start()
        network.removeBdkFiles(fileList)
        spinner.succeed('Remove all existing files!')
      }
      return confirmDelete
    } else {
      return true
    }
  })()

  if (confirm) {
    const networkGenerate: NetworkGenerateType = await (async () => {
      if (argv.interactive) {
        const { validatorNumber, memberNumber } = await prompts([
          {
            type: 'number',
            name: 'validatorNumber',
            message: 'How many validator do you want?',
            min: 1,
            initial: 4,
          },
          {
            type: 'number',
            name: 'memberNumber',
            message: 'How many member do you want?',
            min: 0,
            initial: 0,
          },
        ], { onCancel })

        return { validatorNumber, memberNumber }
      } else {
        throw new ParamsError('Invalid params: Required parameter missing')
      }
    })()
    const spinner = ora('Quorum Network Generate ...').start()
    await network.generate(networkGenerate)
    spinner.succeed('Quorum Network Generate Successfully!')
  }
}
