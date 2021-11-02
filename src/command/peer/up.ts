import { Arguments, Argv } from 'yargs'
import prompts, { Choice } from 'prompts'
import Peer from '../../service/peer'
import config from '../../config'
import { logger, onCancel } from '../../util'
import BdkFile from '../../instance/bdkFile'

export const command = 'up'

export const desc = '啟動 Peer org 的機器'

interface OptType {
  interactive: boolean
  peerHostNames: string[]
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk peer up --interactive', 'Cathay BDK 互動式問答')
    .example('bdk peer up -n Org1 -n Org2', '啟動 Org1 和 Org2 名稱的 Peer org')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('peer-host-names', { type: 'array', description: '啟動機器 Peer org 的名稱', alias: 'n' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const peer = new Peer(config)

  const peerHostNames: string[] = await (async () => {
    if (argv.interactive) {
      const bdkFile = new BdkFile(config)
      const fileNames = bdkFile.getDockerComposeList().peer
      const fileNameSelect: Choice[] = fileNames.map((fileName) => {
        return {
          title: fileName,
          value: fileName,
        } as Choice
      })

      const peerUpQuestion: prompts.PromptObject<string>[] = [{
        type: 'multiselect',
        name: 'peerHostNames',
        message: 'What is your all peers docker compose yaml',
        choices: fileNameSelect,
      }]
      const peerOrg = await prompts(peerUpQuestion, { onCancel })
      return peerOrg.peerHostNames
    } else if (argv.peerHostNames) {
      return argv.peerHostNames
    }
    return []
  })()

  if (peerHostNames.length > 0) {
    for (const peerHostname of peerHostNames) {
      await peer.up({ peerHostname })
    }
  } else {
    logger.error('[x] Please add argument in command!')
  }
}
