import { Argv } from 'yargs'

export const command = 'network'

export const desc = '管理 Eth Network network 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('network').demandCommand()
}

export const handler = {}
