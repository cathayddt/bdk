import { Arguments } from 'yargs'
import { logger } from '../../util'

export const command = 'remove'

export const desc = '[TODO] Remove orderer'

export const builder = {}

export const handler = (argv: Arguments) => {
  logger.debug('exec orderer remove', argv.$0)
  // TODO
}
