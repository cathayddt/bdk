import { Arguments, Argv } from 'yargs'
import prompts, { Choice } from 'prompts'
import Orderer from '../../service/orderer'
import config from '../../config'
import { logger, onCancel } from '../../util'
import BdkFile from '../../instance/bdkFile'

export const command = 'up'

export const desc = '啟動 Orderer org 的機器'

interface OptType {
  interactive: boolean
  ordererHostNames: string[]
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk orderer up --interactive', 'Cathay BDK 互動式問答')
    .example('bdk orderer up -n OrdererOrg ', '啟動名稱為 OrdererOrg 名稱的 Orderer org')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('orderer-host-names', { type: 'array', description: '啟動機器 Orderer org 的名稱', alias: 'n' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const orderer = new Orderer(config)

  const ordererHostNames: string[] = await (async () => {
    if (argv.interactive) {
      const bdkFile = new BdkFile(config)
      const fileNames = bdkFile.getDockerComposeList().orderer
      const fileNameSelect: Choice[] = fileNames.map((fileName) => {
        return {
          title: fileName,
          value: fileName,
        } as Choice
      })

      const ordererUpQuestion: prompts.PromptObject<string>[] = [{
        type: 'multiselect',
        name: 'ordererHostNames',
        message: 'What is your all orderers docker compose yaml',
        choices: fileNameSelect,
      }]
      const ordererOrg = await prompts(ordererUpQuestion, { onCancel })
      return ordererOrg.ordererHostNames
    } else if (argv.ordererHostNames) {
      return argv.ordererHostNames
    }
    return []
  })()

  if (ordererHostNames.length > 0) {
    for (const ordererHostname of ordererHostNames) {
      await orderer.up({ ordererHostname })
    }
  } else {
    logger.error('[x] Please add argument in command!')
  }
}
