import { Argv, Arguments } from 'yargs'
import { ethers } from 'ethers'
import config from '../../config'
import Cluster from '../../service/cluster'
import Wallet from '../../../wallet/service/wallet'
import { ClusterGenerateType } from '../../model/type/kubernetes.type'
import { NetworkCreateType } from '../../model/type/network.type'
import { WalletType } from '../../../wallet/model/type/wallet.type'
import { defaultNetworkConfig } from '../../model/defaultNetworkConfig'
import { onCancel } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'

export const command = 'generate'

export const desc = '產生 Quorum Cluster 所需的相關設定檔案'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum cluster generate --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const cluster = new Cluster(config)
  const wallet = new Wallet()

  const clusterGenerate: ClusterGenerateType = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'select',
          name: 'chartPackageModeEnabled',
          message: 'What is the connect mode you want?',
          choices: [
            {
              title: 'package mode (package without helm and k8s)',
              value: false,
            },
            {
              title: 'template mode (template with helm and k8s)',
              value: true,
            },
          ],
          initial: 0,
        },
      ], { onCancel })) as ClusterGenerateType
    } else {
      return {
        chartPackageModeEnabled: false,
      }
    }
  })()
  // network create
  const networkCreate: NetworkCreateType = await (async () => {
    if (argv.interactive) {
      const { chainId, validatorNumber, memberNumber } = await prompts([
        {
          type: 'number',
          name: 'chainId',
          message: 'What is your chain id?',
          min: 0,
          initial: 81712,
        },
        {
          type: 'number',
          name: 'validatorNumber',
          message: 'How many validator do you want?',
          min: 1,
          initial: 4,
        },
        {
          type: 'number',
          name: 'memberNumber',
          message: 'How many member do you want?',
          min: 0,
          initial: 0,
        },
      ], { onCancel })

      const { walletOwner } = await prompts({
        type: 'select',
        name: 'walletOwner',
        message: 'Do you already own a wallet?',
        choices: [
          {
            title: 'true',
            value: true,
          },
          {
            title: 'false',
            value: false,
          },
        ],
        initial: 1,
      })

      let walletAddress: string

      if (walletOwner) {
        const { address } = await prompts({
          type: 'text',
          name: 'address',
          message: 'What is your wallet address?',
          validate: walletAddress => ethers.utils.isAddress(walletAddress) ? true : 'Address not valid.',
        }, { onCancel })

        walletAddress = address
      } else {
        const { address, privateKey } = wallet.createWalletAddress(WalletType.ETHEREUM)
        walletAddress = address
        ora().stopAndPersist({
          text: `Your ${WalletType.ETHEREUM} wallet address: 0x${walletAddress}`,
          symbol: '🔑',
        })
        ora().stopAndPersist({
          text: `Wallet private key: ${privateKey}`,
          symbol: '🔑',
        })
      }

      const alloc = [{
        account: walletAddress,
        amount: '1000000000000000000000000000',
      }]

      return { chainId, validatorNumber, memberNumber, alloc }
    } else {
      const { address, privateKey } = wallet.createWalletAddress(WalletType.ETHEREUM)
      return defaultNetworkConfig(address, privateKey)
    }
  })()

  const spinner = ora('Quorum Network Import ...').start()
  await cluster.generate(clusterGenerate, networkCreate)
  spinner.succeed('Quorum Network Import Successfully!')
}
