import { Argv, Arguments } from 'yargs'
import { hello } from '../service/hello'

export const command = 'hello <xxx> [yyy]'

export const desc = '歡迎使用 Cathay BDK'

interface ArgType {
  xxx: string
  yyy?: string
}
interface OptType {
  a: boolean
  b?: string
  c?: number
  interactive: boolean
}

export const builder = (yargs: Argv<ArgType & OptType>) => {
  return yargs
    .positional('xxx', { type: 'string' })
    .positional('yyy', { type: 'number' })
    .option('a', { type: 'boolean', default: false })
    .option('b', { type: 'string' })
    .option('c', { type: 'string', choices: ['1', '2', '3'], alias: 'chill' })
    .option('interactive', { type: 'boolean', default: true, description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = (argv: Arguments<ArgType & OptType>) => {
  console.log(process.env.NODE_ENV)
  hello(argv)
}
