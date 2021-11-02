import { Arguments, Argv } from 'yargs'
import prompts from 'prompts'
import Orderer from '../../service/orderer'
import { logger, onCancel } from '../../util'
import config from '../../config'

export const command = 'add'

export const desc = '在 Orderer org 新增 Orderer'

interface OptType {
  interactive: boolean
  ordererHostnames: string[]
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk orderer add --interactive', 'Cathay BDK 互動式問答')
    .example('bdk orderer add --orderer-hostnames orderer1', '在名稱為 BDK_ORG_DOMAIN 的 Orderer org 新增 Hostname 為 orderer1 的 Orderer')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('orderer-hostnames', { type: 'array', description: '新增 Orderer 的 Hostname', alias: 'h' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const orderer = new Orderer(config)

  if (!(config.orgName && config.orgDomainName)) {
    if (!config.orgName) logger.error('[x] There is not your org name! ( set in environment variable BDK_ORG_NAME')
    if (!config.orgDomainName) logger.error('[x] There is not your org name! ( set in environment variable BDK_ORG_DOMAIN')
  } else {
    let ordererHostnames: string[] = []

    if (argv.interactive) {
      const ordererQuestions: prompts.PromptObject<string>[] = [{
        type: 'list',
        name: 'hostnames',
        message: 'What is orderer org all hostname?',
      }]

      const ordererAddConfig = await prompts(ordererQuestions, { onCancel })
      ordererHostnames = ordererAddConfig.hostnames
    } else {
      if (argv.ordererHostnames) ordererHostnames = argv.ordererHostnames
    }

    if (ordererHostnames.length > 0) {
      orderer.add({ ordererHostnames, genesisFileName: 'genesis' })
    } else {
      logger.error('[x] Please add argument in command!')
    }
  }
}
