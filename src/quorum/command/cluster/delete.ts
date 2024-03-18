import { Argv } from 'yargs'
import config from '../../config'
import Cluster from '../../service/cluster'
import { onCancel } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'

export const command = 'delete'

export const desc = '刪除現有的 Quorum Cluster 網路'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum cluster delete', 'Cathay BDK 互動式問答')
}

export const handler = async () => {
  const cluster = new Cluster(config)

  const confirm: boolean = await (async () => {
    const fileList = cluster.getHelmChartFiles()
    if (fileList.length !== 0) {
      const confirmDelete = (await prompts({
        type: 'confirm',
        name: 'value',
        message: '⚠️ Detecting quorum cluster already exists. The following processes will remove all existing files. Continue?',
        initial: false,
      }, { onCancel })).value
      if (confirmDelete) {
        const spinner = ora('Quorum Cluster Create ...').start()
        cluster.removeHelmChartFiles()
        spinner.succeed('Remove all existing files!')
      }
      return confirmDelete
    } else {
      return true
    }
  })()

  if (confirm) {
    const spinner = ora('Deployments Under Namespace Quorum Delete ...').start()
    await cluster.delete()
    spinner.succeed('Quorum Cluster Delete Successfully!')
  }
}
