import { Arguments } from 'yargs'
import config from '../../config'
import Explorer from '../../service/explorer'
import { logger } from '../../../util'
import ora from 'ora'

export const command = 'down'

export const desc = 'stop blockchain explorer.'

export const builder = {}

export const handler = async (argv: Arguments) => {
  logger.debug('exec explorer down', argv.$0)

  const explorer = new Explorer(config)

  const spinner = ora('Fabric Explorer Down ...').start()
  await explorer.down()
  spinner.succeed('Fabric Explorer Down Successfully!')
}
