import { Argv } from 'yargs'

export const command = 'fabric'

export const desc = '管理 Hyperledger Fabric 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('command').demandCommand().completion()
}

export const handler = {}
