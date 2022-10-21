import { Argv, Arguments } from 'yargs'
import Explorer from '../../service/explorer'
import { onCancel, ParamsError } from '../../../util/error'
import config from '../../config'
import prompts from 'prompts'
import { logger } from 'ethers'

export const command = 'create'

export const desc = '產生 Blockchain explorer 所需的相關設定檔案'

interface OptType {
  interactive: boolean
  genesis: boolean
  dockerCompose: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum network create --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i', default: false })
}

export const handler = async (argv: Arguments<OptType>) => {
  const explorer = new Explorer(config)

  const explorerCreate: number = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'number',
          name: 'port',
          message: 'What is the port of blockscout explorer?',
          min: 0,
          max: 65535,
          initial: 26000,
        },
      ], { onCancel })).port
    }
    throw new ParamsError('Invalid params: Required parameter missing')
  })()

  await explorer.create(explorerCreate)
  logger.info(`Explorer create in : http://localhost:${explorerCreate}`)
}
