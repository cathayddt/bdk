import { ethers } from 'ethers'
import prompts from 'prompts'
import { Argv, Arguments } from 'yargs'
import Network from '../../service/network'
import { onCancel, ParamsError } from '../../../util/error'
import { NetworkCreateType } from '../../model/type/network.type'
import config from '../../config'

export const command = 'create'

export const desc = '產生 Blockchain network 所需的相關設定檔案'

interface OptType {
  interactive: boolean
  genesis: boolean
  dockerCompose: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum network create --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i', default: false })
}

export const handler = async (argv: Arguments<OptType>) => {
  const network = new Network(config)

  const networkCreate: NetworkCreateType = await (async () => {
    if (argv.interactive) {
      const { chainId, validatorNumber, memberNumber } = await prompts([
        {
          type: 'number',
          name: 'chainId',
          message: 'What is your chain id?',
          min: 0,
          initial: 0,
        },
        {
          type: 'number',
          name: 'validatorNumber',
          message: 'How many validator do you want?',
          min: 1,
          initial: 1,
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
        walletAddress = await network.createWalletAddress().address
      }

      const alloc = [{
        account: walletAddress,
        amount: '1000000000000000000000000000',
      }]

      return { chainId, validatorNumber, memberNumber, alloc }
    }
    throw new ParamsError('Invalid params: Required parameter missing')
  })()

  network.create(networkCreate)
}
