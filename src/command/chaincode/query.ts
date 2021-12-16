import { Argv, Arguments } from 'yargs'
import prompts from 'prompts'
import { logger, onCancel } from '../../util'
import { ChaincodeQueryType } from '../../model/type/chaincode.type'
import Chaincode from '../../service/chaincode'
import Channel from '../../service/channel'
import { committedChaincodeChoice, joinedChannelChoice } from '../../model/prompts/util'
import config from '../../config'

export const command = 'query'

export const desc = 'query chaincode function'

interface OptType {
  interactive: boolean
  channelId: string
  chaincodeName: string
  chaincodeFunction: string
  args?: any[]
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('channel-id', { type: 'string', description: 'The channel on which this command should be executed', alias: 'C' })
    .option('chaincode-name', { type: 'string', description: 'Name of the chaincode', alias: 'n' })
    .option('chaincode-function', { type: 'string', description: 'Function of the chaincode', alias: 'f' })
    .option('args', { type: 'array', description: 'Constructor message for the chaincode in JSON format', alias: 'a' })
}

export const handler = async (argv: Arguments<OptType>) => {
  logger.debug('exec chaincode query')

  const chaincode = new Chaincode(config)
  const channel = new Channel(config)

  let queryChannelInput: ChaincodeQueryType
  if (argv.interactive) {
    const { channelId } = await prompts([
      {
        type: 'select',
        name: 'channelId',
        message: 'Which channel do you want query chaincode',
        choices: await joinedChannelChoice(channel),
      },
    ], { onCancel })

    const { chaincodeName, chaincodeFunction, args } = await prompts([
      {
        type: 'select',
        name: 'chaincodeName',
        message: 'What is your chaincode name?',
        choices: await committedChaincodeChoice(channelId, chaincode),
      },
      {
        type: 'text',
        name: 'chaincodeFunction',
        message: 'What is your chaincode function?',
      },
      {
        type: 'list',
        name: 'args',
        message: 'What is your args?',
      },
    ], { onCancel })

    queryChannelInput = { channelId, chaincodeName, chaincodeFunction, args }
  } else {
    queryChannelInput = {
      channelId: argv.channelId,
      chaincodeName: argv.chaincodeName,
      chaincodeFunction: argv.chaincodeFunction,
      args: argv.args || [],
    }
  }

  const queryResult = await chaincode.query(queryChannelInput)
  if (!('stdout' in queryResult)) {
    throw new Error('command only for docker infra')
  }
  logger.info(`${JSON.stringify(Chaincode.parser.query(queryResult))}`)
}
