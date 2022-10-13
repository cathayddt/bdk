import { Argv } from 'yargs'

export const command = 'quorum'

export const desc = '管理 Quorum 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('../quorum/command').demandCommand()
}

export const handler = {}
