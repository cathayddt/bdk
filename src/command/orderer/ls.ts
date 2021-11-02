import { Arguments } from 'yargs'
import { logger } from '../../util'

export const command = 'ls'

export const desc = '[TODO] List all orderer org'

export const builder = {}

export const handler = (argv: Arguments) => {
  logger.debug('exec orderer org ls', argv.$0)
  // TODO
}
