import config from '../../config'
import Explorer from '../../service/explorer'
import { onCancel } from '../../../util'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'delete'

export const desc = 'Delete existing blockchain explorer'

export const builder = {}

export const handler = async () => {
  const { networkType } = await prompts([
    {
      type: 'select',
      name: 'networkType',
      message: 'Select the blockchain explorer type to delete:',
      choices: getNetworkTypeChoices(),
    },
  ])
  console.log(`Selected network type: ${networkType}`)

  const explorer = new Explorer(config, networkType)

  let confirmDelete = true

  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message: `⚠️ The following processes will remove all ${networkType} explorer files. Confirm to delete ${networkType} explorer?`,
    initial: false,
  }, { onCancel })

  confirmDelete = response.value

  if (confirmDelete) {
    const spinner = ora(`Deleting ${networkType.charAt(0).toUpperCase() + networkType.slice(1)} Explorer...`).start()
    await explorer.delete()
    spinner.succeed(`${networkType.charAt(0).toUpperCase() + networkType.slice(1)} Explorer deleted successfully!`)
  }
}