import { Argv } from 'yargs'
import config from '../../config'
import Config from '../../service/config'
import { logger } from '../../../util'
import ora from 'ora'
export const command = 'ls'

export const desc = '列出所有 Cathay BDK 此時環境變數'

export const builder = (yargs: Argv) => {
  return yargs
}

export const handler = () => {
  const configService = new Config(config)

  const envConfig = configService.ls()

  const spinner = ora('Fabric Config List ...').start()
  logger.info(`${JSON.stringify(envConfig)}`)
  spinner.succeed('Fabric Config List Successfully!')
}
