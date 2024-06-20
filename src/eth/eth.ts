import { Argv } from 'yargs'

export const command = 'eth'

export const desc = '管理 Eth 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('../eth/command').demandCommand()
}

export const handler = {}
