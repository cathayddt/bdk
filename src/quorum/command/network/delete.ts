import config from '../../config'
import Network from '../../service/network'
import { onCancel } from '../../../util'
import prompts from 'prompts'
import ora from 'ora'

export const command = 'delete'

export const desc = '刪除現有的 Quorum Network'

export const builder = {}

export const handler = async () => {
  const network = new Network(config)

  let confirmDelete = true

  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message: '⚠️ The following processes will remove all network files. Confirm to delete Quorum Network?',
    initial: false,
  }, { onCancel })

  confirmDelete = response.value

  if (confirmDelete) {
    const spinner = ora('Quorum Network Delete ...').start()
    await network.delete()
    spinner.succeed('Quorum Network Delete Successfully!')
  }
}
