import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Cluster from '../../service/cluster'
import { onCancel } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import { NetworkType, getNetworkTypeChoices } from '../../config/network.type'

export const command = 'delete'

export const desc = '刪除現有的 Cluster 網路'

interface OptType {}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk eth cluster delete', '刪除 Cluster')
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
        const spinner = ora(`${networkTypeWithBigFirstLetter} Cluster files removing...`).start()
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
    await cluster.delete(networkType as NetworkType)
    spinner.succeed(`${networkTypeWithBigFirstLetter} Cluster Delete Successfully!`)
  }
}