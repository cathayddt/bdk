import config from '../config'
import { transports, format, createLogger } from 'winston'
import { LEVEL } from 'triple-beam'

const defaultLoggerConfig = {
  level: config.isSillyMode ? 'silly' : 'debug',
  silent: config.isTestMode,
  format: format.combine(
    format.splat(),
    format.timestamp(),
    format.colorize(),
    format.printf(
      info => {
        if (info[LEVEL as any] === 'info') {
          return info.message.trim()
        } else {
          return `[bdk] ${info.timestamp} - ${info.level}: ${info.message}`
        }
      },
    ),
  ),
  transports: [new transports.Console({ stderrLevels: ['debug', 'warn', 'error'] })],
}

const devLoggerConfig = {
  ...defaultLoggerConfig,
}

const prodLoggerConfig = {
  ...defaultLoggerConfig,
  level: 'info',
}

const logger = createLogger(
  config.isDevMode
    ? devLoggerConfig
    : prodLoggerConfig,
)

export { logger }
