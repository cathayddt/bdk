import { Arguments } from 'yargs'
import { logger } from '../../util'

export const command = 'remove'

export const desc = '[TODO] Remove one peer in org'

export const builder = {}

export const handler = (argv: Arguments) => {
  logger.debug('exec peer remove', argv.$0)
  // TODO
}
