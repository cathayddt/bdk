import { logger } from '../util/logger'

export const hello = (argv: any) => {
  // 呼叫 servicer 並使用 logger
  // console.log()
  logger.debug(`Hello World! ${argv}`)
  logger.info(`Hello World! ${argv}`)
  logger.warn(`Hello World! ${argv}`)
}
