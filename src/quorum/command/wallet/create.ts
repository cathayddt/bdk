// import { Argv } from 'yargs'

// export const command = 'create'

// export const desc = '產生 Blockchain network 所需的相關設定檔案'

// interface OptType {
//   interactive: boolean
//   file: string
//   createFull: boolean
//   cryptogen: boolean
//   genesis: boolean
//   connectionProfile: boolean
//   dockerCompose: boolean
//   testNetwork: boolean
// }

// export const builder = (yargs: Argv<OptType>) => {
//   return yargs
//     .example('bdk network create --interactive', 'Cathay BDK 互動式問答')
//     .example('bdk network create --file ~/.bdk/network-create.json --create-full', '使用在路徑下 json 檔案中的參數，產生 Blockchain network 所需的相關設定檔案')
//     .example('bdk network create --file ~/.bdk/network-create.json --cryptogen', '使用在路徑下 json 檔案中的參數和 cryptogen，產生憑證和私鑰')
//     .option('file', { type: 'string', description: '需要的參數設定 json 檔案路徑', alias: 'f' })
//     .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i', default: false })
//     .option('create-full', { type: 'boolean', description: '是否產生 Blockchain network 所需要的所有相關設定檔案（包含使用 cryptogen 產生憑證和私鑰、產生創始區塊、產生 Peer 連接設定檔案、產生 Peer/Orderer docker-compose 檔案）', default: false })
// }
