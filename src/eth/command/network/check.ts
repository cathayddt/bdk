import { Argv, Arguments } from 'yargs'
import config from '../../config'
import prompts from 'prompts'
import Network from '../../service/network'
import { onCancel, ParamsError, ProcessError } from '../../../util/error'
import ora from 'ora'

export const command = 'check'

export const desc = '確認 Quorum Node 資訊'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum network check --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const network = new Network(config, 'quorum')

  if (argv.interactive) {
    const node: string = await (async () => {
      const nodeList = network.getUpExportItems()

      if (nodeList.length !== 0) {
        return (await prompts({
          type: 'select',
          name: 'node',
          message: 'Which node do you want to check?',
          choices: nodeList,
        }, { onCancel })).node
      } else {
        throw new ProcessError('[x] [file-system error]: Node not exist')
      }
    })()
    const checkOption = [
      { title: 'isValidator', value: 'istanbul.isValidator()' },
      { title: 'getValidator', value: 'istanbul.getValidators()' },
      { title: 'peerCount', value: 'net.peerCount' },
      { title: 'chainId', value: 'admin.nodeInfo.protocols.eth.network' },
    ]

    const { method } = await prompts([
      {
        type: 'select',
        name: 'method',
        message: 'What do you want to check?',
        choices: checkOption,
      },
    ], { onCancel })

    const spinner = ora('Quorum Network Check ...').start()
    const result = await network.checkNode(node, method)
    spinner.succeed(`Quorum Network Check Result: ${result}`)
    spinner.succeed('Quorum Network Check Successfully!')
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
