import config from '../config'
import { logger } from '../util/logger'

export const hello = (argv: any) => {
  logger.debug('[%s] Hello debug! %s', config.environment, argv)
  logger.info('[%s] Hello info! %s', config.environment, argv)
  logger.warn('[%s] Hello warn! %s', config.environment, argv)
  logger.error('[%s] Hello error! %s', config.environment, argv)
}
