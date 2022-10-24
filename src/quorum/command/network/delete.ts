import { Arguments } from 'yargs'
import config from '../../config'
import Network from '../../service/network'
import { logger } from '../../../util'

export const command = 'delete'

export const desc = 'stop quorum network.'

export const builder = {}

export const handler = async (argv: Arguments) => {
  logger.debug('exec network delete', argv.$0)

  const network = new Network(config)

  await network.delete()
  logger.info('Network Service delete Successfully')
}
