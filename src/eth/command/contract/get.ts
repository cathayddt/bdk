import config from '../../config'
import Contract from '../../service/contract'
import { onCancel } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const builder = {}

export const handler = async () => {
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
