import { Argv } from 'yargs'

export const command = 'chaincode'

export const desc = '管理 Chaincode 的指令'

export const builder = (yargs: Argv) => {
  return yargs.commandDir('chaincode').demandCommand()
}

export const handler = {}
