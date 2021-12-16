import fs from 'fs'
import { Argv, Arguments } from 'yargs'
import Network from '../../service/network'
import prompts from 'prompts'
import {
  NetworkCreateType,
} from '../../model/type/network.type'
import { onCancel, ParamsError } from '../../util'
import { peerQuestions } from '../../model/prompts/peerQuestion'
import { ordererQuestions } from '../../model/prompts/ordererQuestion'
import { testNetworkConfig } from '../../model/testNetworkConfig'
import config from '../../config'

export const command = 'create'

export const desc = '產生 Blockchain network 所需的相關設定檔案'

interface OptType {
  interactive: boolean
  file: string
  createFull: boolean
  cryptogen: boolean
  genesis: boolean
  connectionProfile: boolean
  dockerCompose: boolean
  testNetwork: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk network create --interactive', 'Cathay BDK 互動式問答')
    .example('bdk network create --file ~/.bdk/network-create.json --create-full', '使用在路徑下 json 檔案中的參數，產生 Blockchain network 所需的相關設定檔案')
    .example('bdk network create --file ~/.bdk/network-create.json --cryptogen', '使用在路徑下 json 檔案中的參數和 cryptogen，產生憑證和私鑰')
    .example('bdk network create --file ~/.bdk/network-create.json --genesis', '使用在路徑下 json 檔案中的參數，產生創始區塊')
    .example('bdk network create --file ~/.bdk/network-create.json --connection-profile', '使用在路徑下 json 檔案中的參數，產生 Peer 連接設定檔案')
    .example('bdk network create --file ~/.bdk/network-create.json --docker-compose', '使用在路徑下 json 檔案中的參數，產生 Peer/Orderer docker-compose 檔案')
    .option('file', { type: 'string', description: '需要的參數設定 json 檔案路徑', alias: 'f' })
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i', default: false })
    .option('create-full', { type: 'boolean', description: '是否產生 Blockchain network 所需要的所有相關設定檔案（包含使用 cryptogen 產生憑證和私鑰、產生創始區塊、產生 Peer 連接設定檔案、產生 Peer/Orderer docker-compose 檔案）', default: false })
    .option('cryptogen', { type: 'boolean', description: '是否使用 cryptogen 產生憑證和私鑰', default: false })
    .option('genesis', { type: 'boolean', description: '是否產生創始區塊', default: false })
    .option('connection-profile', { type: 'boolean', description: '是否產生 Peer 連接設定檔案', default: false })
    .option('docker-compose', { type: 'boolean', description: '是否產生 Peer/Orderer docker-compose 檔案', default: false })
    .option('test-network', { type: 'boolean', description: '建立測試用的 Blockchain Network', default: false })
}

export const handler = async (argv: Arguments<OptType>) => {
  const network = new Network(config)

  const testNetwork = argv.testNetwork
  const createFull = argv.createFull ? argv.createFull : testNetwork

  const networkCreate: NetworkCreateType = await (async () => {
    if (testNetwork) {
      return testNetworkConfig
    } else if (argv.file) {
      return JSON.parse(fs.readFileSync(argv.file).toString())
    } else if (argv.interactive) {
      const ordererOrg = await prompts([
        {
          type: 'number',
          name: 'count',
          message: 'How many orderer org do you want?',
          min: 0,
          initial: 1,
        },
      ], { onCancel })

      const ordererOrgs = []
      const ordererOrgNames = []
      for (let i = 0; i < ordererOrg.count; i++) {
        const networkCreateOrdererOrg = await ordererQuestions(i)

        ordererOrgs.push(networkCreateOrdererOrg)
        ordererOrgNames.push(networkCreateOrdererOrg.name)
      }

      const checkOrdererOrgNameRepeat = ordererOrgNames.filter((ordererOrgName, index, arr) => {
        return arr.indexOf(ordererOrgName) !== index
      })

      if (checkOrdererOrgNameRepeat.length !== 0) throw new ParamsError('Invalid params: Duplicate parameters <orderer-org-name>')

      const peerOrg = await prompts([
        {
          type: 'number',
          name: 'count',
          message: 'How many peer org do you want?',
          min: 1,
          initial: 1,
        },
      ], { onCancel })

      const peerOrgs = []
      const peerOrgNames = []
      for (let i = 0; i < peerOrg.count; i++) {
        const networkCreatePeerOrg = await peerQuestions(i)

        peerOrgs.push(networkCreatePeerOrg)
        peerOrgNames.push(networkCreatePeerOrg.name)
      }

      const checkPeerOrgNameRepeat = peerOrgNames.concat(ordererOrgNames).filter((peerOrgName, index, arr) => {
        return arr.indexOf(peerOrgName) !== index
      })

      if (checkPeerOrgNameRepeat.length !== 0) throw new ParamsError('Invalid params: Duplicate parameters <peer-org-name>')

      return { ordererOrgs, peerOrgs }
    }
    throw new ParamsError('Invalid params: Required parameter missing')
  })()

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

  const genesis: boolean = await (async () => {
    if (argv.interactive) {
      return (await prompts(
        {
          type: 'confirm',
          name: 'genesis',
          message: 'Do you want to generate genesis.block?',
          initial: false,
        }, { onCancel })).genesis
    } else {
      return argv.genesis
    }
  })()

  const connectionProfile: boolean = await (async () => {
    if (argv.interactive) {
      return (await prompts(
        {
          type: 'confirm',
          name: 'connectionProfile',
          message: 'Do you want to generate peer connection profile?',
          initial: false,
        }, { onCancel })).connectionProfile
    } else {
      return argv.connectionProfile
    }
  })()

  const dockerCompose: boolean = await (async () => {
    if (argv.interactive) {
      return (await prompts(
        {
          type: 'confirm',
          name: 'dockerCompose',
          message: 'Do you want to generate orderer/peer docker-compose yaml?',
          initial: false,
        }, { onCancel })).dockerCompose
    } else {
      return argv.dockerCompose
    }
  })()

  network.createNetworkFolder()

  if (cryptogen || createFull) {
    await network.cryptogen(networkCreate)
  }

  network.copyTLSCa(networkCreate)

  if (genesis || createFull) {
    await network.createGenesisBlock(networkCreate)
  }

  if (connectionProfile || createFull) {
    network.createConnectionProfile(networkCreate)
  }

  if (dockerCompose || createFull) {
    network.createDockerCompose(networkCreate)
  }
}
