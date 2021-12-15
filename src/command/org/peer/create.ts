import fs from 'fs'
import prompts from 'prompts'
import { Arguments, Argv } from 'yargs'
import Peer from '../../../service/peer'
import { onCancel, ParamsError } from '../../../util'
import { NetworkCreatePeerOrgType } from '../../../model/type/network.type'
import { peerQuestions } from '../../../model/prompts/peerQuestion'
import { OrgPeerCreateType } from '../../../model/type/org.type'
import config from '../../../config'

export const command = 'create'

export const desc = '產生欲加入 Channel 的 Peer org 所需的相關設定檔案'

interface OptType {
  interactive: boolean
  file: string
  createFull: boolean
  cryptogen: boolean
  configtxJSON: boolean
  connectionProfile: boolean
  dockerCompose: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk org peer create --interactive', 'Cathay BDK 互動式問答')
    .example('bdk org peer create --file ~/.bdk/org-peer-create.json --create-full', '使用在路徑下 json 檔案中的參數，產生 Peer org 所需的相關設定檔案')
    .example('bdk org peer create --file ~/.bdk/org-peer-create.json --cryptogen', '使用在路徑下 json 檔案中的參數和 cryptogen，產生憑證和私鑰')
    .example('bdk org peer create --file ~/.bdk/org-peer-create.json --configtxJSON', '使用在路徑下 json 檔案中的參數和 configtx.yaml 產生 Peer org 的 json 檔案')
    .example('bdk org peer create --file ~/.bdk/org-peer-create.json --connection-profile', '使用在路徑下 json 檔案中的參數，產生 Peer 連接設定檔案')
    .example('bdk org peer create --file ~/.bdk/org-peer-create.json --docker-compose', '使用在路徑下 json 檔案中的參數，產生 Peer docker-compose 檔案')
    .option('file', { type: 'string', description: '需要的參數設定 json 檔案路徑', alias: 'f' })
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('create-full', { type: 'boolean', description: '是否產生 Hyperledger Fabric 所需要的所有相關設定檔案（包含使用 cryptogen 產生憑證和私鑰、使用 configtx.yaml 產生 Peer org 的 json 檔案、產生 Peer 連接設定檔案、產生 Peer/Orderer docker-compose 檔案）', default: false })
    .option('cryptogen', { type: 'boolean', description: '是否使用 cryptogen 產生憑證和私鑰', default: false })
    .option('configtxJSON', { type: 'boolean', description: '是否使用 configtx.yaml 產生 Peer Org 的 json 檔案', default: false })
    .option('connection-profile', { type: 'boolean', description: '是否產生 Peer 連接設定檔案', default: false })
    .option('docker-compose', { type: 'boolean', description: '是否產生 Peer docker-compose 檔案', default: false })
}

export const handler = async (argv: Arguments<OptType>) => {
  const peer = new Peer(config)

  const networkCreatePeerOrgs: NetworkCreatePeerOrgType[] = await (async () => {
    if (argv.file) {
      return JSON.parse(fs.readFileSync(argv.file).toString())
    } else if (argv.interactive) {
      const peerOrg = await prompts([
        {
          type: 'number',
          name: 'count',
          message: 'How many peer org do you want?',
          min: 1,
          initial: 1,
        },
      ], { onCancel })

      const peerOrgs: NetworkCreatePeerOrgType[] = []
      const peerOrgNames: string[] = []
      for (let i = 0; i < peerOrg.count; i++) {
        const cryptoConfigPeerOrg = await peerQuestions(i)

        peerOrgs.push(cryptoConfigPeerOrg)
        peerOrgNames.push(cryptoConfigPeerOrg.name)
      }

      const checkNameRepeat = peerOrgNames.filter((peerOrgName, index, arr) => {
        return arr.indexOf(peerOrgName) !== index
      })

      if (checkNameRepeat.length !== 0) throw new ParamsError('Invalid params: Duplicate parameters <peer-org-name>')

      return peerOrgs
    }
    throw new ParamsError('Invalid params: Required parameter missing')
  })()
  const orgPeerCreate: OrgPeerCreateType = {
    peerOrgs: networkCreatePeerOrgs,
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
          message: 'Do you want to generate peer org config json file?',
          choices: [
            {
              title: 'Yes, please generate peer org config json file',
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

  if (cryptogen || argv.createFull) {
    await peer.cryptogen(orgPeerCreate)
  }

  peer.copyTLSCa(orgPeerCreate)

  if (configtxJSON || argv.createFull) {
    await peer.createPeerOrgConfigtxJSON(orgPeerCreate)
  }

  if (connectionProfile || argv.createFull) {
    peer.createConnectionProfileYaml(orgPeerCreate)
  }

  if (dockerCompose || argv.createFull) {
    peer.createDockerCompose(orgPeerCreate)
  }
}
