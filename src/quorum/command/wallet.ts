import { Argv } from 'yargs'

export const command = 'wallet'

export const desc = '管理 Quorum wallet 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('wallet').demandCommand()
}

export const handler = {}
