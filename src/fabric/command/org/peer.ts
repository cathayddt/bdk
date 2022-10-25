import { Argv } from 'yargs'

export const command = 'peer'

export const desc = '管理 Peer org 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('peer').demandCommand()
}

export const handler = {}
