import fs from 'fs'
import prompts from 'prompts'
import { Arguments, Argv } from 'yargs'
import { onCancel, ParamsError } from '../../../util'
import { NetworkCreateOrdererOrgType } from '../../../model/type/network.type'
import Orderer from '../../../service/orderer'
import { ordererQuestions } from '../../../model/prompts/ordererQuestion'
import { OrgOrdererCreateType } from '../../../model/type/org.type'
import config from '../../../config'

export const command = 'create'

export const desc = '產生欲加入 Blockchin network 的 Orderer org 所需的相關設定檔案'

interface OptType {
  interactive: boolean
  file: string
  genesisFileName: string
  createFull: boolean
  cryptogen: boolean
  configtxJSON: boolean
  dockerCompose: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk org orderer create --interactive', 'Cathay BDK 互動式問答')
    .example('bdk org orderer create --file ~/.bdk/org-orderer-create.json --create-full', '使用在路徑下 json 檔案中的參數，產生 Orderer org 所需的相關設定檔案')
    .example('bdk org orderer create --file ~/.bdk/org-orderer-create.json --cryptogen', '使用在路徑下 json 檔案中的參數和 cryptogen，產生憑證和私鑰')
    .example('bdk org orderer create --file ~/.bdk/org-orderer-create.json --configtxJSON', '使用在路徑下 json 檔案中的參數和 configtx.yaml 產生 Orderer org 的 json 檔案')
    .example('bdk org orderer create --file ~/.bdk/org-orderer-create.json --docker-compose', '使用在路徑下 json 檔案中的參數，產生 Orderer docker-compose 檔案')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('file', { type: 'string', description: '需要的參數設定 json 檔案路徑', alias: 'f' })
    .option('genesis-file-name', { type: 'string', description: 'Orderer 機器讀取的創始區塊的檔案名稱', alias: 'g' })
    .option('create-full', { type: 'boolean', description: '是否產生 Hyperledger Fabric 所需要的所有相關設定檔案（包含使用 cryptogen 產生憑證和私鑰、使用 configtx.yaml 產生 Orderer org 的 json 檔案、產生 Orderer docker-compose 檔案）', default: false })
    .option('cryptogen', { type: 'boolean', description: '是否使用 cryptogen 產生憑證和私鑰', default: false })
    .option('configtxJSON', { type: 'boolean', description: '是否使用 configtx.yaml 產生 Orderer Org 的 json 檔案', default: false })
    .option('connection-config', { type: 'boolean', description: '是否產生 Orderer 連接設定檔案', default: false })
    .option('docker-compose', { type: 'boolean', description: '是否產生 Orderer docker-compose 檔案', default: false })
}

export const handler = async (argv: Arguments<OptType>) => {
  const orderer = new Orderer(config)

  const networkCreateOrdererOrgs: NetworkCreateOrdererOrgType[] = await (async () => {
    if (argv.file) {
      return JSON.parse(fs.readFileSync(argv.file).toString())
    } else if (argv.interactive) {
      const ordererOrg = await prompts([
        {
          type: 'number',
          name: 'count',
          message: 'How many orderer org do you want?',
          min: 1,
          initial: 1,
        },
      ], { onCancel })

      const ordererOrgs: NetworkCreateOrdererOrgType[] = []
      const ordererOrgNames: string[] = []
      for (let i = 0; i < ordererOrg.count; i++) {
        const cryptoConfigOrdererOrg = await ordererQuestions(i)

        ordererOrgs.push(cryptoConfigOrdererOrg)
        ordererOrgNames.push(cryptoConfigOrdererOrg.name)
      }

      const checkNameRepeat = ordererOrgNames.filter((ordererOrgName, index, arr) => {
        return arr.indexOf(ordererOrgName) !== index
      })

      if (checkNameRepeat.length !== 0) throw new ParamsError('Invalid params: Duplicate parameters <orderer-org-name>')

      return ordererOrgs
    }
    throw new ParamsError('Invalid params: Required parameter missing')
  })()

  const genesisFileName: string = await (async () => {
    if (argv.interactive) {
      return (await prompts(
        {
          type: 'text',
          name: 'genesisFileName',
          message: 'What is your genesis block file name?',
          initial: 'new.genesis',
        }, { onCancel })).genesisFileName
    } else if (argv.genesisFileName) {
      return argv.genesisFileName
    }
    throw new ParamsError('Invalid params: Required parameter missing <genesis-file-name>')
  })()

  const orgOrdererCreate: OrgOrdererCreateType = {
    ordererOrgs: networkCreateOrdererOrgs,
    genesisFileName,
  }

  const cryptogen: boolean = await (async () => {
    if (argv.interactive) {
      return (await prompts(
        {
          type: 'select',
          name: 'cryptogen',
          message: 'Do you want to generate cert-key pair with cryptogen?',
          choices: [
            {
              title: 'Yes, please generate them for me with cryptogen',
              value: true,
            }, {
              title: 'No, I will supply for them (~/.bdk/[network_name]/[org_name])',
              value: false,
            },
          ],
          initial: 1,
        }, { onCancel })).cryptogen
    } else {
      return argv.cryptogen
    }
  })()

  const configtxJSON: boolean = await (async () => {
    if (argv.interactive) {
      return (await prompts(
        {
          type: 'select',
          name: 'configtxJSON',
          message: 'Do you want to generate orderer org config json file?',
          choices: [
            {
              title: 'Yes, please generate orderer org config json file',
              value: true,
            }, {
              title: 'No, I will supply for them (~/.bdk/[network_name]/org-json/[org_name])',
              value: false,
            },
          ],
          initial: 1,
        }, { onCancel })).configtxJSON
    } else {
      return argv.configtxJSON
    }
  })()

  const dockerCompose: boolean = await (async () => {
    if (argv.interactive) {
      return (await prompts(
        {
          type: 'confirm',
          name: 'dockerCompose',
          message: 'Do you want to generate orderer docker-compose yaml?',
          initial: false,
        }, { onCancel })).dockerCompose
    } else {
      return argv.dockerCompose
    }
  })()

  if (cryptogen || argv.createFull) {
    await orderer.cryptogen(orgOrdererCreate)
  }

  orderer.copyTLSCa(orgOrdererCreate)

  if (configtxJSON || argv.createFull) {
    await orderer.createOrdererOrgConfigtxJSON(orgOrdererCreate)
  }

  if (dockerCompose || argv.createFull) {
    orderer.createDockerCompose(orgOrdererCreate)
  }
}
