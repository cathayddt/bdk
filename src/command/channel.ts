import { Argv } from 'yargs'

export const command = 'channel'

export const desc = '管理 Channel 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('channel').demandCommand()
}

export const handler = {}
