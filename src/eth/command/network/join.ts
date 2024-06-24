import { Argv, Arguments } from 'yargs'
import config from '../../config'
import prompts from 'prompts'
import Network from '../../service/network'
import { onCancel, ParamsError, ProcessError } from '../../../util/error'
import ora from 'ora'
import { JoinNodeType } from '../../model/type/network.type'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'join'

export const desc = '選擇現有節點加入 Quorum Network'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum network join --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments) => {
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
    const node: string = await (async () => {
      const nodeList = network.getUpExportItems()

      if (nodeList.length !== 0) {
        return (await prompts({
          type: 'select',
          name: 'node',
          message: 'Select the node you want to join to other network?',
          choices: nodeList,
        }, { onCancel })).node
      } else {
        throw new ProcessError('[x] [file-system error]: Node not exist')
      }
    })()
    if (!node.includes('validator') && !node.includes('member')) {
      throw new ProcessError('[x] [node-type error]: Node must be validator or member')
    }

    const { ipAddress, genesisJson, staticNodesJson } = await prompts([
      {
        type: 'text',
        name: 'ipAddress',
        message: 'Provide the ip address of Quorum network you want to join',
      },
      {
        type: 'text',
        name: 'genesisJson',
        message: 'Paste the genesis.json file of Quorum network you want to join',
      },
      {
        type: 'text',
        name: 'staticNodesJson',
        message: 'Paste the static-nodes.json file of Quorum network you want to join',
      },
    ], { onCancel })

    const joinNodeConfig: JoinNodeType = {
      node: node,
      ipAddress: ipAddress,
      genesisJson: JSON.parse(genesisJson),
      staticNodesJson: JSON.parse(staticNodesJson),
    }

    const spinner = ora(`${networkTypeWithBigFirstLetter} Network Join ...`).start()
    await network.joinNode(joinNodeConfig)
    spinner.succeed(`${networkTypeWithBigFirstLetter} Network Join ${node} Successfully!`)
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
