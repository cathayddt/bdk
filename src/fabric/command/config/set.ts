import { Argv } from 'yargs'
import Config from '../../service/config'
import prompts from 'prompts'
import { onCancel } from '../../../util'
import config from '../../config'
import ora from 'ora'

export const command = 'set'

export const desc = '增加 / 更改環境變數'

export interface ConfigSetParams {
  interactive: boolean
  key: string
  value: string
}

// export const aliases = ''

export const builder = (yargs: Argv) => {
  return yargs
    .example('bdk fabric config set --interactive', 'Cathay BDK 互動式問答')
    .example('bdk fabric config set --key TEST_CONFIG --value test', '設定 TEST_CONFIG 為 test')
    .option('interactive', { alias: 'i', describe: '是否使用 Cathay BDK 互動式問答', type: 'boolean' })
    .option('key', { alias: 'k', describe: 'key of environmental variable', type: 'string' })
    .option('value', { alias: 'v', describe: 'value of environmental variable', type: 'string' })
}

export const handler = async (argv: ConfigSetParams) => {
  const configService = new Config(config)

  if (argv.interactive) {
    const args = await prompts([
      {
        type: 'text',
        name: 'key',
        message: 'Please input key to add/edit',
      },
      {
        type: 'text',
        name: 'value',
        message: 'Please input value to add/edit',
      },
    ], { onCancel })
    const spinner = ora('Fabric Config Set ...').start()
    configService.set(args)
    spinner.succeed(`Fabric Config Set Successfully! key: key: ${args.key}, value: ${args.value}`)
  } else {
    const spinner = ora('Fabric Config Set ...').start()
    configService.set({ key: argv.key, value: argv.value })
    spinner.succeed(`Fabric Config Set Successfully! key: ${argv.key}, value: ${argv.value}`)
  }
}
