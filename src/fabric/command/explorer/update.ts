import { Argv } from 'yargs'
import Explorer from '../../service/explorer'
import { logger } from '../../../util'
import config from '../../config'
import ora from 'ora'

export const command = 'update'

export const desc = '更新 Blockchain explorer 連接的 Peer'

export const builder = (yargs: Argv) => {
  return yargs
}

export const handler = async () => {
  logger.debug('exec explorer update')

  const explorer = new Explorer(config)

  const spinner = ora('Fabric Explorer Update ...').start()
  await explorer.updateForMyOrg()
  spinner.succeed('Fabric Explorer Update Successfully!')
}
