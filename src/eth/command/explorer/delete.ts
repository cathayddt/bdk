import config from '../../config'
import Explorer from '../../service/explorer'
import { onCancel } from '../../../util'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'delete'

export const desc = '刪除現有的 Eth Network Explorer.'

export const builder = {}

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
  const explorer = new Explorer(config, networkType)

  let confirmDelete = true

  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message: `⚠️ The following processes will remove all explorer files. Confirm to delete ${networkTypeWithBigFirstLetter} Explorer?`,
    initial: false,
  }, { onCancel })

  confirmDelete = response.value

  if (confirmDelete) {
    const spinner = ora(`${networkType} Explorer Delete ...`).start()
    await explorer.delete()
    spinner.succeed(`${networkTypeWithBigFirstLetter} Explorer Delete Successfully!`)
  }
}
