import { Arguments } from 'yargs'
import config from '../../config'
import Network from '../../service/network'
import { logger } from '../../../util'
import ora from 'ora'

export const command = 'add'

export const desc = '新增 Validator'

export const builder = {}

export const handler = async (argv: Arguments) => {
  logger.debug('exec network add', argv.$0)

  const network = new Network(config)

  const confirmAdd = true

  if (confirmAdd) {
    const spinner = ora('Quorum Network Add ...').start()
    const validatorNum = await network.addValidatorLocal()
    spinner.succeed(`Quorum Network Add Validator${validatorNum} Successfully!`)
  }
}
