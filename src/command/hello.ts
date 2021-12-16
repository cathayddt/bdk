import { Argv, Arguments } from 'yargs'
import { hello } from '../service/hello'

export const command = 'hello'

export const desc = '歡迎使用 Cathay BDK'

export const builder = (yargs: Argv<any>) => {
  return yargs
}

export const handler = (argv: Arguments<any>) => {
  hello(argv)
}
