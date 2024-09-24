import { Argv } from 'yargs'
import config from '../../config'
import Cluster from '../../service/cluster'
import { onCancel } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices, NetworkType } from '../../config/network.type'

export const command = 'delete'

export const desc = '刪除現有的 Eth Network Cluster 網路'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk eth network cluster delete', 'Cathay BDK 互動式問答')
}

export const handler = async () => {
  const { networkType } = await prompts([{
    type: 'select',
    name: 'networkType',
    message: 'What is your network?',
    choices: getNetworkTypeChoices(),
  }]) as { networkType: NetworkType }

  const networkTypeWithBigFirstLetter = networkType.charAt(0).toUpperCase() + networkType.slice(1)
  const cluster = new Cluster(config, networkType)
  const confirm: boolean = await (async () => {
    const fileList = cluster.getHelmChartFiles()
    if (fileList.length !== 0) {
      const confirmDelete = (await prompts({
        type: 'confirm',
        name: 'value',
        message: `⚠️ Detecting ${networkTypeWithBigFirstLetter} cluster already exists. The following processes will remove all existing files. Continue?`,
        initial: false,
      }, { onCancel })).value
      return confirmDelete
    } else {
      return true
    }
  })()

  if (confirm) {
    const spinner = ora(`${networkTypeWithBigFirstLetter} Cluster Delete ...`).start()
    await cluster.delete(networkType)
    cluster.removeHelmChartFiles()
    spinner.succeed(`${networkTypeWithBigFirstLetter} Cluster Delete Successfully!`)
  }
}
