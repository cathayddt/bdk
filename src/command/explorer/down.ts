import { Arguments } from 'yargs'
import config from '../../config'
import Explorer from '../../service/explorer'
import { logger } from '../../util'

export const command = 'down'

export const desc = 'stop blockchain explorer.'

export const builder = {}

export const handler = async (argv: Arguments) => {
  logger.debug('exec explorer down', argv.$0)

  const explorer = new Explorer(config)

  await explorer.down()
}
