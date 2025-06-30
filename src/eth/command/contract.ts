import { Argv } from 'yargs'

export const command = 'contract'

export const desc = '管理 Eth contract 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('contract').demandCommand()
}

export const handler = {}
