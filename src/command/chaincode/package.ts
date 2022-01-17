import { Arguments, Argv } from 'yargs'
import prompts from 'prompts'
import Chaincode from '../../service/chaincode'
import { ChaincodePackageType } from '../../model/type/chaincode.type'
import { logger, onCancel } from '../../util'
import config from '../../config'

export const command = 'package'

export const desc = '打包 Chaincode 輸出成 tar 檔案'

interface OptType {
  interactive: boolean
  chaincodeName: string
  chaincodeVersion: number
  path: string
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk chaincode package --interactive', 'Cathay BDK 互動式問答')
    .example('bdk chaincode package --chaincode-name fabcar --chaincode-version 1 --path ./chaincode/fabcar/go', '打包路徑位置 ./chaincode/fabcar/go 檔案為 fabcar 名稱版號為 1 的 Chaincode')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('chaincode-name', { type: 'string', description: '欲打包 Chaincode 的名稱', alias: 'n' })
    .option('chaincode-version', { type: 'number', default: 1, description: '打包 Chaincode 的版本', alias: 'v' })
    .option('path', { type: 'string', default: '.', description: '打包 Chaincode 檔案的檔案路徑位置', alias: 'p' })
}

export const handler = async (argv: Arguments<OptType>) => {
  logger.debug('exec chaincode package')

  const chaincode = new Chaincode(config)

  let packageChannelInput: ChaincodePackageType
  if (argv.interactive) {
    packageChannelInput = await prompts([
      {
        type: 'text',
        name: 'name',
        message: 'What is your chaincode name?',
        initial: 'fabcar',
      },
      {
        type: 'number',
        name: 'version',
        message: 'What is your chaincode version?',
        initial: 1,
      },
      {
        type: 'text',
        name: 'path',
        message: 'What is your chaincode path?',
        initial: './chaincode/fabcar/go',
      },
    ], { onCancel })
  } else {
    const { chaincodeName, chaincodeVersion, path } = argv
    packageChannelInput = { name: chaincodeName, version: chaincodeVersion, path }
  }
  await chaincode.package(packageChannelInput)
}
