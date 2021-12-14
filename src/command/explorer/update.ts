import { Arguments, Argv } from 'yargs'
import Explorer from '../../service/explorer'
import prompts from 'prompts'
import { logger, ParamsError } from '../../util'
import Peer from '../../service/peer'
import { ExplorerUpForMyOrgType } from '../../model/type/explorer.type'
import config from '../../config'

export const command = 'update'

export const desc = '更新 Blockchain explorer 連接的 Peer'

export const builder = (yargs: Argv) => {
  return yargs
}

export const handler = async (argv: Arguments) => {
  logger.debug('exec explorer update')

  const explorer = new Explorer(config)

  await explorer.updateForMyOrg()
}
