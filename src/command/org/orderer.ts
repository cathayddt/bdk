import { Argv } from 'yargs'

export const command = 'orderer'

export const desc = '管理 Orderer org 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('orderer').demandCommand()
}

export const handler = {}
