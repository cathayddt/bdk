import { Argv } from 'yargs'

export const command = 'besu'

export const desc = '管理 Besu 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('../besu/command').demandCommand()
}

export const handler = {}
