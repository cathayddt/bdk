import prompts from 'prompts'
import { Argv, Arguments } from 'yargs'
import Wallet from '../service/wallet'
import { onCancel } from '../../util/error'
import { WalletCreateType, WalletType } from '../model/type/wallet.type'
import ora from 'ora'

export const command = 'create'

export const desc = '產生 Wallet 的相關資訊'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk wallet create --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const wallet = new Wallet()

  let type: WalletType

  if (argv.interactive) {
    const walletOption = [
      { title: 'ethereum', value: WalletType.ETHEREUM },
    ]

    const { walletType } = await prompts([{
      type: 'select',
      name: 'walletType',
      message: 'What type of wallet you want to create?',
      choices: walletOption,
    }], { onCancel })
    type = walletType
  } else {
    type = WalletType.ETHEREUM
  }

  const walletCreateConfig: WalletCreateType = {
    type: type,
  }

  const spinner = ora('Wallet Create ...').start()
  const result = await wallet.create(walletCreateConfig)
  spinner.succeed(`Wallet Create Result:\n ${result}`)
  spinner.succeed('Wallet Create Successfully!')
}
