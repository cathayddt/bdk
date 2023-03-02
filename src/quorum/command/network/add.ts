import { Argv, Arguments } from 'yargs'
import config from '../../config'
import prompts from 'prompts'
import Network from '../../service/network'
import { onCancel, ParamsError } from '../../../util/error'
import ora from 'ora'
import { AddValidatorRemoteType } from '../../model/type/network.type'
import { ethers } from 'ethers'

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
    const connectOptionList = [
      { title: 'local', value: 'local' },
      { title: 'remote', value: 'remote' },
    ]
    const { connectOption } = await prompts([
      {
        type: 'select',
        name: 'connectOption',
        message: 'Which type of connection do you want?',
        choices: connectOptionList,
      },
    ], { onCancel })

    const nodeOptionList = [
      { title: 'validator', value: 'validator' },
      { title: 'member', value: 'member' },
    ]
    const { nodeOption } = await prompts([
      {
        type: 'select',
        name: 'nodeOption',
        message: 'Which type of node do you want to add?',
        choices: nodeOptionList,
      },
    ], { onCancel })

    if (connectOption === 'local') {
      if (nodeOption === 'validator') {
        const spinner = ora('Quorum Network Add ...').start()
        const validatorNum = await network.addValidatorLocal()
        spinner.succeed(`Quorum Network Add Validator${validatorNum} Successfully!`)
      } else {
        const spinner = ora('Quorum Network Add ...').start()
        const memberNum = await network.addMemberLocal()
        spinner.succeed(`Quorum Network Add Member${memberNum} Successfully!`)
      }
    } else if (connectOption === 'remote') {
      if (nodeOption === 'validator') {
        const { validatorAddress, validatorPublicKey, discoveryPort, ipAddress } = await prompts([
          {
            type: 'text',
            name: 'validatorAddress',
            message: 'Paste the address of the node you want to add',
            validate: validatorAddress => ethers.utils.isAddress(validatorAddress) ? true : 'Address not valid.',
          },
          {
            type: 'text',
            name: 'validatorPublicKey',
            message: 'Paste the public key of the node you want to add',
            validate: validatorPublicKey => validatorPublicKey.length === 128 ? true : 'Public key not valid.',
          },
          {
            type: 'text',
            name: 'discoveryPort',
            message: 'Provide the discovery port of the node you want to add',
          },
          {
            type: 'text',
            name: 'ipAddress',
            message: 'Provide the ip address of the node you want to add',
          },
        ], { onCancel })

        const addValidatorRemoteConfig: AddValidatorRemoteType = {
          validatorAddress: `0x${validatorAddress.replace(/^0x/, '').toLowerCase()}`,
          validatorPublicKey: validatorPublicKey,
          discoveryPort: discoveryPort,
          ipAddress: ipAddress,
        }

        const spinner = ora('Quorum Network Add ...').start()
        await network.addValidatorRemote(addValidatorRemoteConfig)
        spinner.succeed(`Quorum Network Add Validator ${validatorAddress} Successfully!`)
      }
      // TODO: addMemberRemote
    }
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
