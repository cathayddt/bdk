import { Arguments, Argv } from 'yargs'
import prompts from 'prompts'
import Peer from '../../service/peer'
import { logger } from '../../util'
import config from '../../config'

export const command = 'add'

export const desc = '在 Peer Org 中新增新的 Peer'

interface OptType {
  interactive: boolean
  peerCount: number
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk peer add --interactive', 'Cathay BDK 互動式問答')
    .example('bdk peer add --peer-count 1', '在 Peer Org 中新增 1 個 Peer')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('peer-count', { type: 'number', description: '在 Peer Org 中新增的 Peer 個數', alias: 'c' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const peer = new Peer(config)

  if (!(config.orgName && config.orgDomainName)) {
    if (!config.orgName) logger.error('[x] There is not your org name! ( set in environment variable BDK_ORG_NAME')
    if (!config.orgDomainName) logger.error('[x] There is not your org name! ( set in environment variable BDK_ORG_DOMAIN')
  } else {
    let peerCount = 0

    if (argv.interactive) {
      const peerAddQuestions: prompts.PromptObject<string>[] = [{
        type: 'number',
        name: 'peerCount',
        message: `What is peer count in peer org ${config.orgName}`,
      }]
      const peerOrgConfig = await prompts(peerAddQuestions)
      peerCount = peerOrgConfig.peerCount
    } else {
      if (argv.peerCount) peerCount = argv.peerCount
    }

    if (peerCount > 0) {
      peer.add({ peerCount })
    } else {
      logger.error('[x] Please add argument in command!')
    }
  }
}
