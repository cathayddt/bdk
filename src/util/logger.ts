import config from '../config'
import { transports, format, createLogger } from 'winston'

// TODO logs to cloudwatch
// TODO logs for user

const transportsConfig = {
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.align(),
    format.printf(
      info => `[bdk] ${info.timestamp} - ${info.level}: ${info.message}`,
    ),
  ),
}

const logger = createLogger({
  level: config.isDevMode ? 'debug' : 'info',
  silent: config.isTestMode,
  transports: [
    // - Write to all logs with specified level to console.
    new transports.Console(transportsConfig),
  ],
})

export { logger }
