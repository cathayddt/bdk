import { Arguments, Argv } from 'yargs'
import Explorer from '../../service/explorer'
import { logger, onCancel } from '../../util'
import config from '../../config'
import prompts from 'prompts'

export const command = 'up'

export const desc = '啟動 Blockchain explorer'

interface OptType {
  interactive: boolean
  user: string
  pass: string
  port: number
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i', default: false })
    .option('user', { type: 'string', description: 'explorer 的預設使用者名稱', alias: 'u', default: 'exploreradmin' })
    .option('pass', { type: 'string', description: 'explorer 的預設使用者密碼', alias: 'p', default: 'exploreradminpw' })
    .option('port', { type: 'number', description: 'explorer 的預設使用者名稱', alias: 'P', default: 8080 })
    .example('bdk explorer up --interactive', 'Cathay BDK 互動式問答')
    .example('bdk explorer up --user alice --pass pass123 --port 8080', '建立 explore ，使用者帳號為 alice ，密碼為 pass123 ，使用的 port 是 8080')
}

export const handler = async (argv: Arguments<OptType>) => {
  logger.debug('exec explorer up')
  const explorer = new Explorer(config)
  let explorerUpInput

  if (argv.interactive) {
    explorerUpInput = await prompts([
      {
        type: 'text',
        name: 'user',
        message: 'What is your explorer default username?',
        initial: 'exploreradmin',
      },
      {
        type: 'text',
        name: 'pass',
        message: 'What is your explorer default password?',
        initial: 'exploreradminpw',
      },
      {
        type: 'number',
        name: 'port',
        message: 'What is your channel name?',
        initial: '8080',
      },
    ], { onCancel })
  } else {
    explorerUpInput = argv
  }

  await explorer.upForMyOrg(explorerUpInput)
}
