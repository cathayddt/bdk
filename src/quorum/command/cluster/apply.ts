import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Cluster from '../../service/cluster'
import { onCancel, ParamsError } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'

export const command = 'apply'

export const desc = '產生 Quorum Cluster 所需的相關設定檔案並建立網路'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum cluster create --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const cluster = new Cluster(config)
  const spinner = ora('Quorum Network Import ...').start()
  await cluster.create()
  spinner.succeed('Quorum Network Import Successfully!')
}
