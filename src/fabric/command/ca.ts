import { Argv } from 'yargs'

export const command = 'ca'

export const desc = '管理 CA 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('ca').demandCommand()
}

export const handler = {}
