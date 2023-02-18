import { ethers } from 'ethers'
import prompts from 'prompts'
import { Argv, Arguments } from 'yargs'
import Network from '../../service/network'
import { onCancel } from '../../../util/error'
import { NetworkCreateType } from '../../model/type/network.type'
import config from '../../config'
import { defaultNetworkConfig } from '../../model/defaultNetworkConfig'
import ora from 'ora'

export const command = 'create'

export const desc = '產生 Quorum network 所需的相關設定檔案並建立網路'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum network create --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const network = new Network(config)
  // check bdkPath files exist or not (include useless file e.g. .DS_Store)
  const confirm: boolean = await (async () => {
    network.createBdkFolder()
    const fileList = network.getBdkFiles()
    if (fileList.length !== 0) {
      const confirmDelete = (await prompts({
        type: 'confirm',
        name: 'value',
        message: '⚠️ Detecting quorum nodes already exists. The following processes will remove all existing files. Continue?',
        initial: false,
      }, { onCancel })).value
      if (confirmDelete) {
        const spinner = ora('Quorum Network Create ...').start()
        network.removeBdkFiles(fileList)
        spinner.succeed('Remove all existing files!')
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
          const { address, privateKey } = await network.createWalletAddress()
          walletAddress = address
          ora().stopAndPersist({
            text: `Your wallet address: 0x${walletAddress}`,
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
        const { address, privateKey } = await network.createWalletAddress()
        return defaultNetworkConfig(address, privateKey)
      }
    })()
    const spinner = ora('Quorum Network Create ...').start()
    await network.create(networkCreate)
    spinner.succeed('Quorum Network Create Successfully!')
  }
}
