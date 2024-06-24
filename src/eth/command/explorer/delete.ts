import config from '../../config'
import Explorer from '../../service/explorer'
import { onCancel } from '../../../util'
import prompts from 'prompts'
import ora from 'ora'

export const command = 'delete'

export const desc = '刪除現有的 Quorum Explorer.'

export const builder = {}

export const handler = async () => {
  const explorer = new Explorer(config, 'quorum')

  let confirmDelete = true

  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message: '⚠️ The following processes will remove all explorer files. Confirm to delete Quorum Explorer?',
    initial: false,
  }, { onCancel })

  confirmDelete = response.value

  if (confirmDelete) {
    const spinner = ora('Quorum Explorer Delete ...').start()
    await explorer.delete()
    spinner.succeed('Quorum Explorer Delete Successfully!')
  }
}
