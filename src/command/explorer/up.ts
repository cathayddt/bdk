import { Arguments, Argv } from 'yargs'
import Explorer from '../../service/explorer'
import { logger } from '../../util'
import config from '../../config'

export const command = 'up'

export const desc = '啟動 Blockchain explorer'

export const builder = (yargs: Argv) => {
  return yargs
}

export const handler = async (argv: Arguments) => {
  logger.debug('exec explorer up')

  const explorer = new Explorer(config)
  await explorer.upForMyOrg()
}
