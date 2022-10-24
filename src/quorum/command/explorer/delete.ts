import { Arguments } from 'yargs'
import config from '../../config'
import Explorer from '../../service/explorer'
import { logger } from '../../../util'

export const command = 'delete'

export const desc = 'stop blockchain explorer.'

export const builder = {}

export const handler = async (argv: Arguments) => {
  logger.debug('exec explorer delete', argv.$0)

  const explorer = new Explorer(config)

  await explorer.delete()
  logger.info('Explorer Service delete Successfully')
}
