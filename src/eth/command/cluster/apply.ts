import { Argv, Arguments } from 'yargs'
import { isAddress } from 'ethers'
import config from '../../config'
import Cluster from '../../service/cluster'
import Wallet from '../../../wallet/service/wallet'
import { onCancel } from '../../../util/error'
import { ClusterCreateType } from '../../model/type/kubernetes.type'
import { WalletType } from '../../../wallet/model/type/wallet.type'
import { defaultNetworkConfig } from '../../model/defaultNetworkConfig'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'apply'

export const desc = '產生 Quorum/Besu Cluster 所需的相關設定檔案並建立網路'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk eth cluster apply --interactive', 'Cathay BDK 互動式問答')
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
  const cluster = new Cluster(config, networkType)
  const wallet = new Wallet()
  const networkTypeWithBigFirstLetter = networkType.charAt(0).toUpperCase() + networkType.slice(1)

  const confirm: boolean = await (async () => {
    const fileList = cluster.getHelmChartFiles()
    if (fileList.length !== 0) {
      const confirmDelete = (await prompts({
        type: 'confirm',
        name: 'value',
        message: `⚠️ Detecting ${networkTypeWithBigFirstLetter} cluster already exists. The following processes will remove all existing files. Continue?`,
        initial: false,
      }, { onCancel })).value
      if (confirmDelete) {
        const spinner = ora(`${networkTypeWithBigFirstLetter} Cluster Delete ...`).start()
        cluster.removeHelmChartFiles()
        spinner.succeed('Remove all existing files!')
      }
      return confirmDelete
    } else {
      return true
    }
  })()

  if (confirm) {
    // network create
    const clusterCreate: ClusterCreateType = await (async () => {
      if (argv.interactive) {
        const { provider } = await prompts({
          type: 'select',
          name: 'provider',
          message: 'What is your cloud provider?',
          choices: [
            {
              title: 'GCP/local',
              value: 'local',
            },
            {
              title: 'AWS',
              value: 'aws',
            },
            {
              title: 'Azure',
              value: 'azure',
            },
          ],
          initial: 0,
        }, { onCancel })

        let region: string | undefined = ''
        if (provider === 'aws') {
          const { awsRegion } = await prompts({
            type: 'text',
            name: 'awsRegion',
            message: 'What is your region?',
            initial: 'ap-southeast-2',
          }, { onCancel })
          region = awsRegion
        }

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
            validate: walletAddress => isAddress(walletAddress) ? true : 'Address not valid.',
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

        const isBootNode = false
        const bootNodeList: boolean[] = Array(validatorNumber + memberNumber).fill(false)

        return { provider, region, chainId, validatorNumber, memberNumber, alloc, isBootNode, bootNodeList, networkType: networkType }
      } else {
        const { address, privateKey } = wallet.createWalletAddress(WalletType.ETHEREUM)
        const config = defaultNetworkConfig(networkType, address, privateKey)
        return { ...config, provider: 'local', networkType: networkType }
      }
    })()
    const spinner = ora(`${networkTypeWithBigFirstLetter} Cluster Apply ...`).start()
    await cluster.apply(clusterCreate, spinner)
    spinner.succeed(`${networkTypeWithBigFirstLetter} Cluster Apply Successfully!`)
  }
}
