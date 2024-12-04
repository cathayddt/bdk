import { Argv, Arguments } from 'yargs'
import config from '../../config'
import prompts from 'prompts'
import Network from '../../service/network'
import { onCancel, ParamsError, ProcessError } from '../../../util/error'
import ora from 'ora'
import { getNetworkTypeChoices, NetworkType } from '../../config/network.type'

export const command = 'check'

export const desc = '確認 Quorum/Besu Node 資訊'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk eth network check --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  if (argv.interactive) {
    const { networkType } = await prompts([
      {
        type: 'select',
        name: 'networkType',
        message: 'What is your network?',
        choices: getNetworkTypeChoices(),
      },
    ])

    const network = new Network(config, networkType)
    const networkTypeWithBigFirstLetter = networkType.charAt(0).toUpperCase() + networkType.slice(1)

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

    const checkOption = networkType === NetworkType.QUORUM
      ? [
        { title: 'isValidator', value: 'istanbul.isValidator()' },
        { title: 'getValidator', value: 'istanbul.getValidators()' },
        { title: 'peerCount', value: 'net.peerCount' },
        { title: 'chainId', value: 'admin.nodeInfo.protocols.eth.network' },
      ]
      : [
        { title: 'admin_nodeInfo', value: { method: 'admin_nodeInfo', params: '[""]' } },
        {
          title: 'getValidator',
          value: {
            method: 'qbft_getValidatorsByBlockNumber',
            params: '["latest"]',
          },
        },
        { title: 'peerCount', value: { method: 'net_peerCount', params: '[""]' } },
        { title: 'chainId', value: { method: 'eth_chainId', params: '[""]' } },
      ]

    const { method } = await prompts([
      {
        type: 'select',
        name: 'method',
        message: 'What do you want to check?',
        choices: checkOption,
      },
    ], { onCancel })

    const spinner = ora(`${networkTypeWithBigFirstLetter} Network Check ...`).start()
    const result = networkType === NetworkType.QUORUM ? await network.checkNode(networkType, node, method) : await network.checkNode(networkType, node, method.method, method.params)
    spinner.succeed(`${networkTypeWithBigFirstLetter} Network Check Result: ${result}`)
    spinner.succeed(`${networkTypeWithBigFirstLetter} Network Check Successfully!`)
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
