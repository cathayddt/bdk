import { Argv } from 'yargs'

export const command = 'explorer'

export const desc = '管理 Blockchain explorer 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('explorer').demandCommand()
}

export const handler = {}
