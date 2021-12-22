import { Argv, Arguments } from 'yargs'
import Channel from '../../service/channel'
import prompts from 'prompts'
import { PolicyStyleEnum, ChannelConfigEnum } from '../../model/type/channel.type'
import config from '../../config'
import { onCancel, ParamsError } from '../../util'
import { getOrdererList, joinedChannelChoice } from '../../model/prompts/util'

export const command = 'fetch'

export const desc = '取得 Channel 上資訊'

interface OptType {
  interactive: boolean
  name: string
  configStyle: PolicyStyleEnum
  orderer: string
  outputFileName: string
}

const ordererList = getOrdererList(config)

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk channel fetch --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('orderer', { type: 'string', choices: ordererList, description: '選擇 Orderer 建立 Channel', alias: 'o' })
    .option('name', { type: 'string', description: '建立 Channel 的名稱', alias: 'n' })
    .option('config-style', { type: 'string', choices: Object.values(ChannelConfigEnum), description: '欲匯出的 block 種類', alias: 't' })
    .option('output-file-name', { type: 'string', description: '匯出取得 Channel 上資訊的檔案名稱', alias: 'f' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const channel = new Channel(config)

  const orderer: string = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'select',
          name: 'orderer',
          message: 'Ordering service endpoint',
          choices: ordererList.map(x => ({
            title: x,
            value: x,
          })),
        },
      ], { onCancel })).orderer
    } else if (argv.orderer) {
      return argv.orderer
    } else {
      throw new ParamsError('Invalid params: Required parameter <orderer> missing')
    }
  })()

  const name: string = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'select',
          name: 'name',
          message: 'What is your channel name?',
          choices: await joinedChannelChoice(channel),
        },
      ], { onCancel })).name
    } else if (argv.name) {
      return argv.name
    } else {
      throw new ParamsError('Invalid params: Required parameter <name> missing')
    }
  })()

  const configStyle: string = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'select',
          name: 'configStyle',
          message: 'What is your channel name?',
          choices: Object.values(ChannelConfigEnum).map(x => ({
            title: x,
            value: x,
          })),
        },
      ], { onCancel })).configStyle
    } else if (argv.configStyle) {
      return argv.configStyle
    } else {
      throw new ParamsError('Invalid params: Required parameter <config-style> missing')
    }
  })()

  const type: ChannelConfigEnum = (() => {
    switch (configStyle) {
      case 'Genesis_Block':
        return ChannelConfigEnum.GENESIS_BLOCK
      case 'Latest-Block':
        return ChannelConfigEnum.LATEST_BLOCK
      case 'Config-Block':
        return ChannelConfigEnum.CONFIG_BLOCK
      default:
        throw new ParamsError('Invalid params: Required parameter <config-style> missing')
    }
  })()

  const outputFileName: string = await (async () => {
    if (argv.interactive) {
      return (await prompts([
        {
          type: 'text',
          name: 'outputFileName',
          message: 'What is your output file name?',
          initial: ((): string => {
            switch (configStyle) {
              case 'Genesis_Block':
                return 'genesis'
              case 'Latest-Block':
                return 'newest-genesis'
              case 'Config-Block':
                return 'config'
              default:
                throw new ParamsError('Invalid params: Required parameter <config-style> missing')
            }
          })(),
        },
      ], { onCancel })).outputFileName
    } else if (argv.outputFileName) {
      return argv.outputFileName
    } else {
      throw new ParamsError('Invalid params: Required parameter <output-file-name> missing')
    }
  })()

  await channel.fetchChannelBlock({ orderer, channelName: name, configType: type, outputFileName })
}
