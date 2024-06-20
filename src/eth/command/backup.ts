import { Argv } from 'yargs'

export const command = 'backup'

export const desc = '管理 Quorum backup 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('backup').demandCommand()
}

export const handler = {}
