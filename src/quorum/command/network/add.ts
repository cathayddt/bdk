import { Argv, Arguments } from 'yargs'
import config from '../../config'
import prompts from 'prompts'
import Network from '../../service/network'
import { onCancel, ParamsError } from '../../../util/error'
import ora from 'ora'

export const command = 'add'

export const desc = '新增 Validator'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk quorum network add --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments) => {
  const network = new Network(config)

  if (argv.interactive) {
    const optionList = [
      { title: 'validator', value: 'validator' },
      { title: 'member', value: 'member' },
    ]
    const { option } = await prompts([
      {
        type: 'select',
        name: 'option',
        message: 'Which type of node do you want to add?',
        choices: optionList,
      },
    ], { onCancel })

    const spinner = ora('Quorum Network Add ...').start()

    if (option === 'validator') {
      const validatorNum = await network.addValidatorLocal()
      spinner.succeed(`Quorum Network Add Validator${validatorNum} Successfully!`)
    } else {
      const memberNum = await network.addMemberLocal()
      spinner.succeed(`Quorum Network Add Member${memberNum} Successfully!`)
    }
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
