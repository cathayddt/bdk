import { Arguments, Argv } from 'yargs'
import Explorer from '../../service/explorer'
import prompts from 'prompts'
import { logger, ParamsError } from '../../util'
import Peer from '../../service/peer'
import { ExplorerUpForMyOrgType } from '../../model/type/explorer.type'
import config from '../../config'

export const command = 'update'

export const desc = '更新 Blockchain explorer 連接的 Peer'

interface OptType {
  interactive: boolean
  peerAddress: string
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk explorer update --interactive', 'Cathay BDK 互動式問答')
    .example('bdk explorer update --peer-address peer1.example.com:8051', '更新 Blockchain explorer 從 peer1.example.com:8051 取得資訊')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('peer-address', { type: 'string', description: 'peer address and port', alias: 'p' })
}

export const handler = async (argv: Arguments<OptType>) => {
  logger.debug('exec explorer update')

  const explorer = new Explorer(config)
  const peer = new Peer(config)

  const peerAddress: string = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'select',
          name: 'peerAddress',
          message: 'Peer address',
          choices: peer.getPeerAddressList().map(x => ({
            title: x,
            value: x,
          })),
        }])).peerAddress
    } else if (argv.peerAddress) {
      return argv.peerAddress
    } else {
      throw new ParamsError('Invalid params: Required parameter <peer-address> missing')
    }
  })()

  const upForMyOrg: ExplorerUpForMyOrgType = {
    peerAddress,
  }
  await explorer.updateForMyOrg(upForMyOrg)
}
