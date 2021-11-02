import { Arguments, Argv } from 'yargs'
import { ParamsError } from '../../../util'
import Org from '../../../service/org'
import config from '../../../config'

export const command = 'export'

export const desc = '匯出 Org 的 json 設定檔'

interface OptType {
  out: string
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk org config export --out .', '檔案匯出 Org 的 json 設定檔到當前目錄')
    .option('out', { type: 'string', description: '匯出的檔案', alias: 'o' })
}

export const handler = (argv: Arguments<OptType>) => {
  const org = new Org(config)

  const out: string = (() => {
    if (argv.out) {
      return argv.out
    } else {
      throw new ParamsError('Invalid params: Required parameter <out> missing')
    }
  })()

  org.exportConfig(out)
}
