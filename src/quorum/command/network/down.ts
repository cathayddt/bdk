import { Arguments } from 'yargs'
import config from '../../config'
import Network from '../../service/network'
import { logger, onCancel } from '../../../util'
import prompts from 'prompts'
import ora from 'ora'

export const command = 'down'

export const desc = '停止現有的 Quorum Network.'

export const builder = {}

export const handler = async (argv: Arguments) => {
  logger.debug('exec network down', argv.$0)

  const network = new Network(config)

  let confirmDelete = true

  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Confirm to down Quorum Network?',
    initial: false,
  }, { onCancel })

  confirmDelete = response.value

  if (confirmDelete) {
    const spinner = ora('Quorum Network Down ...').start()
    await network.down()
    spinner.succeed('Quorum Network Down Successfully!')
  }
}
