import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Contract from '../../service/contract'
import { onCancel, ParamsError } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'get'

export const desc = '取得合約地址'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk eth contract get --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
  if (!argv.interactive) throw new ParamsError('Invalid params: Required parameter missing')

  const { networkType } = await prompts([
    {
      type: 'select',
      name: 'networkType',
      message: 'What is your network?',
      choices: getNetworkTypeChoices(),
    },
  ], { onCancel })
  const contract = new Contract(config, networkType)
  const data: Record<string, string> = contract.getContractAddress()
  // generate options
  const choices = Object.keys(data).map(key => ({
    title: key,
    value: key,
  }))
  // select contract name
  const { contractName } = await prompts({
    type: 'select',
    name: 'contractName',
    message: 'What is the name of deploy contract?',
    choices: choices,
  }, { onCancel })
  const spinner = ora('Get Contract Address ...').start()
  spinner.succeed(`Contract Address at: ${data[contractName]}`)
}
