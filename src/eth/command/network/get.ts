import { Argv, Arguments } from 'yargs'
import config from '../../config'
import prompts from 'prompts'
import Network from '../../service/network'
import { onCancel, ParamsError, ProcessError } from '../../../util/error'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'get'

export const desc = '取得 Quorum/Besu 檔案資訊'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk eth network get --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const { networkType } = await prompts([
    {
      type: 'select',
      name: 'networkType',
      message: 'What is your network?',
      choices: getNetworkTypeChoices(),
    },
  ])
  const networkTypeWithBigFirstLetter = networkType.charAt(0).toUpperCase() + networkType.slice(1)
  const network = new Network(config, networkType)

  if (argv.interactive) {
    const getOption = [
      { title: 'network', value: 'network' },
      { title: 'node', value: 'node' },
    ]

    const { get } = await prompts([
      {
        type: 'select',
        name: 'get',
        message: 'What kind of information do you want to get?',
        choices: getOption,
      },
    ], { onCancel })

    if (get === 'network') {
      const networkOption = [
        { title: 'genesis.json', value: 'genesis.json' },
        { title: 'static-nodes.json', value: 'static-nodes.json' },
        { title: 'permissioned-nodes.json', value: 'permissioned-nodes.json' },
      ]

      const { networkInfo } = await prompts([
        {
          type: 'select',
          name: 'networkInfo',
          message: 'Which network information do you want to get?',
          choices: networkOption,
        },
      ], { onCancel })

      const spinner = ora(`${networkTypeWithBigFirstLetter} Network Get ...`).start()
      const result = await network.getNetworkInfo(networkInfo)
      spinner.succeed(`${networkTypeWithBigFirstLetter} Network Get Result: ${result}`)
      spinner.succeed(`${networkTypeWithBigFirstLetter} Network Get Successfully!`)
    } else if (get === 'node') {
      const node: string = await (async () => {
        const nodeList = network.getUpExportItems()

        if (nodeList.length !== 0) {
          return (await prompts({
            type: 'select',
            name: 'node',
            message: 'Which node do you want to get?',
            choices: nodeList,
          }, { onCancel })).node
        } else {
          throw new ProcessError('[x] [file-system error]: Node not exist')
        }
      })()

      const nodeOption = [
        { title: 'address', value: 'address' },
        { title: 'publicKey', value: 'publicKey' },
        { title: 'privateKey', value: 'privateKey' },
        { title: 'enodeInfo', value: 'enodeInfo' },
      ]

      const { nodeInfo } = await prompts([
        {
          type: 'select',
          name: 'nodeInfo',
          message: 'Which node information do you want to get?',
          choices: nodeOption,
        },
      ], { onCancel })
      const spinner = ora(`${networkTypeWithBigFirstLetter} Network Get ...`).start()
      const result = network.getNodeInfo(node, nodeInfo)
      spinner.succeed(`${networkTypeWithBigFirstLetter} Network Get Result: ${result}`)
      spinner.succeed(`${networkTypeWithBigFirstLetter} Network Get Successfully!`)
    }
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
