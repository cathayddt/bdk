import { Argv } from 'yargs'

export const command = 'org'

export const desc = '管理 Peer/Orderer org 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('org').demandCommand()
}

export const handler = {}
