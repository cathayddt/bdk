import { Argv } from 'yargs'
import config from '../../config'
import Config from '../../service/config'

export const command = 'init'

export const desc = '初始環境變數'

export const builder = (yargs: Argv) => {
  return yargs
}

export const handler = () => {
  const configService = new Config(config)

  configService.init()
}
