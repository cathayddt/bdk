import { ethers } from 'ethers'
import prompts from 'prompts'
import { Argv, Arguments } from 'yargs'
import Network from '../../service/network'
import Backup from '../../service/backup'
import { onCancel } from '../../../util/error'
import { NetworkCreateType } from '../../model/type/network.type'
import config from '../../config'
import { defaultNetworkConfig } from '../../model/defaultNetworkConfig'
import ora from 'ora'
import Wallet from '../../../wallet/service/wallet'
import { WalletType } from '../../../wallet/model/type/wallet.type'

export const command = 'create'

export const desc = '產生 Besu Network 所需的相關設定檔案並建立網路'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk besu network create --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const network = new Network(config)
  const backup = new Backup(config)
  const wallet = new Wallet()
  // check bdkPath files exist or not (include useless file e.g. .DS_Store)
  const confirm: boolean = await (async () => {
    network.createBdkFolder()
    const fileList = network.getNetworkFiles()
    if (fileList.length !== 0) {
      const confirmDelete = (await prompts({
        type: 'confirm',
        name: 'value',
        message: '⚠️ Detecting besu nodes already exists. The following processes will remove all existing files. Continue?',
        initial: false,
      }, { onCancel })).value
      if (confirmDelete) {
        const spinner = ora('Besu Network Create ...').start()
        // backup before remove
        await backup.exportAll()

        network.removeBdkFiles(fileList)
        spinner.succeed('Backup and remove all existing files!')
      }
      return confirmDelete
    } else {
      return true
    }
  })()

  if (confirm) {
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

        const { isBootNode } = await prompts({
          type: 'select',
          name: 'isBootNode',
          message: 'Using bootnode?',
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

        const createNode = (type: string, index: number, offset = 0) => ({
          title: `${type}${index}`,
          value: `${index + offset}`,
        })

        const nodelist = [
          ...Array.from({ length: validatorNumber }, (_, i) => createNode('validator', i)),
          ...Array.from({ length: memberNumber }, (_, i) => createNode('member', i, validatorNumber)),
        ]

        const bootNodeList: boolean[] = Array(validatorNumber + memberNumber).fill(false)
        if (isBootNode) {
          const isbootNodeList: any = await prompts({
            type: 'multiselect',
            name: 'isbootNodeList',
            message: 'Choose bootnode',
            choices: nodelist,
            initial: '',
          })
          Object.values(isbootNodeList).flat().forEach((node: any) => {
            bootNodeList[node] = true
          })
        }

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

        return { chainId, validatorNumber, memberNumber, alloc, isBootNode, bootNodeList }
      } else {
        const { address, privateKey } = wallet.createWalletAddress(WalletType.ETHEREUM)
        return defaultNetworkConfig(address, privateKey)
      }
    })()
    const spinner = ora('Besu Network Create ...').start()
    await network.create(networkCreate)
    spinner.succeed('Besu Network Create Successfully!')
  }
}
