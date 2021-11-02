import { Arguments } from 'yargs'
import { logger } from '../../util'

export const command = 'ls'

export const desc = '[TODO] List all channel in network'

export const builder = {}

export const handler = (argv: Arguments) => {
  logger.debug('exec channel ls', argv.$0)
  // TODO
}
