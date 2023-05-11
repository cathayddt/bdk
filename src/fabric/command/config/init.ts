import { Argv } from 'yargs'
import config from '../../config'
import Config from '../../service/config'
import ora from 'ora'

export const command = 'init'

export const desc = '初始環境變數'

export const builder = (yargs: Argv) => {
  return yargs
}

export const handler = () => {
  const configService = new Config(config)

  const spinner = ora('Fabric Config Init ...').start()
  configService.init()
  spinner.succeed('Fabric Config Init Successfully!')
}
