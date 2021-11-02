import { Argv } from 'yargs'

export const command = 'config'

export const desc = '管理 Org 設定檔的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('config').demandCommand()
}

export const handler = {}
