import { Argv } from 'yargs'
import config from '../../config'
import Cluster from '../../service/cluster'
import { onCancel } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'delete'

export const desc = '刪除現有的 Quorum/Besu Cluster 網路'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk eth cluster delete --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async () => {
  const { networkType } = await prompts([
    {
      type: 'select',
      name: 'networkType',
      message: 'What is your network?',
      choices: getNetworkTypeChoices(),
    },
  ])
  const cluster = new Cluster(config, networkType)
  const networkTypeWithBigFirstLetter = networkType.charAt(0).toUpperCase() + networkType.slice(1)

  const confirm: boolean = await (async () => {
    const fileList = cluster.getHelmChartFiles()
    if (fileList.length !== 0) {
      const confirmDelete = (await prompts({
        type: 'confirm',
        name: 'value',
        message: `⚠️ Detecting ${networkTypeWithBigFirstLetter} cluster already exists. The following processes will remove all existing files. Continue?`,
        initial: false,
      }, { onCancel })).value
      if (confirmDelete) {
        const spinner = ora(`${networkTypeWithBigFirstLetter} Cluster Delete ...`).start()
        cluster.removeHelmChartFiles()
        spinner.succeed('Remove all existing files!')
      }
      return confirmDelete
    } else {
      return true
    }
  })()

  if (confirm) {
    const spinner = ora(`Deployments Under Namespace ${networkTypeWithBigFirstLetter} Delete ...`).start()
    await cluster.delete(networkType)
    spinner.succeed(`${networkTypeWithBigFirstLetter} Cluster Delete Successfully!`)
  }
}
