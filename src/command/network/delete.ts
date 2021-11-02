import { Argv, Arguments } from 'yargs'
import prompts from 'prompts'
import config from '../../config'
import Network from '../../service/network'
import { logger, onCancel } from '../../util'

export const command = 'delete'

export const desc = '刪除現有的 Blockchain network'

interface OptType {
  networkName: string
  force: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk network delete --network-name test-network', '刪除名稱為 test-network 的 Blockchain network')
    .example('bdk network delete --force', '刪除名稱為在環境變數中的 BDK_NETWORK_NAME 的 Blockchain network 並且不需要再次做確認')
    .option('network-name', { type: 'string', description: '欲刪除 Blockchain network 的名稱', alias: 'n' })
    .option('force', { type: 'boolean', default: false, description: '是否不需要再次確認刪除 Blockchain network', alias: 'f' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const network = new Network(config)

  let confirmDelete = true
  const networkName = argv.networkName ? argv.networkName : config.networkName

  if (!argv.force) {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: `Can you confirm delete blockchain network? [${networkName}]`,
      initial: false,
    }, { onCancel })

    confirmDelete = response.value
  }

  if (confirmDelete) {
    try {
      await network.delete(networkName)
    } catch (error: any) {
      logger.error(error.toString())
    }
  }
}
