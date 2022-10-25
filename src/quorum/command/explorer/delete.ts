import { Arguments } from 'yargs'
import config from '../../config'
import Explorer from '../../service/explorer'
import { logger, onCancel } from '../../../util'
import prompts from 'prompts'

export const command = 'delete'

export const desc = '刪除現有的 Quorum Explorer.'

export const builder = {}

export const handler = async (argv: Arguments) => {
  logger.debug('exec explorer delete', argv.$0)

  const explorer = new Explorer(config)

  let confirmDelete = true

  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Confirm to delete Quorum Explorer?',
    initial: false,
  }, { onCancel })

  confirmDelete = response.value

  if (confirmDelete) {
    await explorer.delete()
    logger.info('Quorum Explorer delete Successfully!')
  }
}
