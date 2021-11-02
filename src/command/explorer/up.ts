import { Arguments, Argv } from 'yargs'
import Explorer from '../../service/explorer'
import prompts from 'prompts'
import { logger, ParamsError } from '../../util'
import Peer from '../../service/peer'
import { ExplorerUpForMyOrgType } from '../../model/type/explorer.type'
import config from '../../config'

export const command = 'up'

export const desc = '啟動 Blockchain explorer'

interface OptType {
  interactive: boolean
  peerAddress: string
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk explorer up --interactive', 'Cathay BDK 互動式問答')
    .example('bdk explorer up --peer-address peer0.example.com:7050', '啟動 Blockchain explorer 並且從 peer0.example.com:7051 取得資訊')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('peer-address', { type: 'string', description: '連接 Peer 的 address 和 port', alias: 'p' })
}

export const handler = async (argv: Arguments<OptType>) => {
  logger.debug('exec explorer up')

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

  await explorer.upForMyOrg(upForMyOrg)
}
