import config from '../../config'
import Network from '../../service/network'
import { onCancel } from '../../../util'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'delete'

export const desc = '刪除現有的 Eth Network'

export const handler = async () => {
  const { networkType } = await prompts([
    {
      type: 'select',
      name: 'networkType',
      message: 'What is your network?',
      choices: getNetworkTypeChoices(),
    },
  ])
  const networkTypeWithBigFirstLetter = networkType.charAt(0).toUpperCase() + networkType.slice(1)

  const network = new Network(config, networkType)

  let confirmDelete = true

  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message: `⚠️ The following processes will remove all network files. Confirm to delete ${networkType} Network?`,
    initial: false,
  }, { onCancel })

  confirmDelete = response.value

  if (confirmDelete) {
    const spinner = ora(`${networkTypeWithBigFirstLetter} Network Delete ...`).start()
    await network.delete()
    spinner.succeed(`${networkTypeWithBigFirstLetter} Network Delete Successfully!`)
  }
}
