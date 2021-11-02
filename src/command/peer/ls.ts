import { Arguments } from 'yargs'
import { logger } from '../../util'

export const command = 'ls'

export const desc = '[TODO]'

export const builder = {}

export const handler = (argv: Arguments) => {
  logger.debug('exec peer org ls', argv.$0)
  // TODO
}
