import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Network from '../../service/network'
import { logger } from '../../../util'
import { onCancel, ParamsError } from '../../../util/error'
import prompts from 'prompts'

export const command = 'up'

export const desc = '啟動現有的 Quorum Network.'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum network up --interactive', 'Cathay BDK 互動式問答')
    .example('bdk quorum network up --all', '啟動 BDK 資料夾下現有的 Quorum Network')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i', default: false })
    .option('all', { type: 'boolean', description: '是否啟動所有節點', alias: 'a' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const network = new Network(config)

  if (argv.all) {
    await network.upAll()
    logger.info('Quorum Network up all Successfully!')
  } else if (argv.interactive) {
    const node: string = await (async () => {
      const nodeList = network.getUpExportItems()

      if (nodeList.length !== 0) {
        return (await prompts({
          type: 'select',
          name: 'node',
          message: 'Which node you want to up?',
          choices: nodeList,
        }, { onCancel })).node
      } else {
        throw new ParamsError('Invalid params: Required node not exist')
      }
    })()

    await network.upService(node)
    logger.info(`Quorum Network up ${node} Successfully!`)
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
