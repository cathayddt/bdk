import { Arguments } from 'yargs'
import config from '../../config'
import Network from '../../service/network'
import { logger, onCancel } from '../../../util'
import prompts from 'prompts'

export const command = 'delete'

export const desc = '刪除現有的 Quorum Network.'

export const builder = {}

export const handler = async (argv: Arguments) => {
  logger.debug('exec network delete', argv.$0)

  const network = new Network(config)

  let confirmDelete = true

  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Confirm to delete Quorum Network?',
    initial: false,
  }, { onCancel })

  confirmDelete = response.value

  if (confirmDelete) {
    await network.delete()
    logger.info('Quorum Network delete Successfully!')
  }
}
