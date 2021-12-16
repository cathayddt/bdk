import { Arguments, Argv } from 'yargs'
import prompts from 'prompts'
import { logger, onCancel } from '../../util'
import Chaincode from '../../service/chaincode'
import config from '../../config'
import { getChaincodeList } from '../../model/prompts/util'

export const command = 'install'

export const desc = '安裝 Chaincode'

interface OptType {
  interactive: boolean
  chaincodeLabel: string
}

const chaincodeList = getChaincodeList(config)
export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk chaincode install --interactive', 'Cathay BDK 互動式問答')
    .example('bdk chaincode install --chaincode-label test_1', '安裝名稱為 test 中標籤為 test_1 的 Chaincode')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('chaincode-label', { type: 'string', description: 'Chaincode package 的標籤名稱', alias: 'l', choices: chaincodeList.map(x => `${x.name}_${x.version}`) })
}

export const handler = async (argv: Arguments<OptType>) => {
  logger.debug('exec chaincode install')

  const chaincode = new Chaincode(config)

  const chaincodeLabel = await (async () => {
    if (argv.interactive) {
      const chaincodeVersionMap: Map<string, number[]> = new Map()
      chaincodeList.forEach(chaincode => {
        chaincodeVersionMap.set(chaincode.name, [...(chaincodeVersionMap.get(chaincode.name) || []), chaincode.version])
      })

      const { chaincodeName } = await prompts([
        {
          type: 'select',
          name: 'chaincodeName',
          message: 'What is your chaincode name?',
          choices: Array.from(chaincodeVersionMap.keys()).map(x => ({
            title: x,
            value: x,
          })),
        },
      ], { onCancel })
      const { chaincodeVersion } = await prompts([
        {
          type: 'select',
          name: 'chaincodeVersion',
          message: 'What is your chaincode version?',
          choices: (chaincodeVersionMap.get(chaincodeName) || []).sort((a, b) => (a - b)).map(x => ({
            title: x.toString(),
            value: x,
          })),
        },
      ], { onCancel })

      return `${chaincodeName}_${chaincodeVersion}`
    } else {
      return argv.chaincodeLabel
    }
  })()

  await chaincode.install({ chaincodeLabel })
}
