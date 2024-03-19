import { Argv } from 'yargs'

export const command = 'cluster'

export const desc = '管理 Quorum cluster 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('cluster').demandCommand()
}

export const handler = {}
