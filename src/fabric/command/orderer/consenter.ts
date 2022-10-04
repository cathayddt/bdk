import { Argv } from 'yargs'

export const command = 'consenter'

export const desc = '管理 Consenter 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('consenter').demandCommand()
}

export const handler = {}
