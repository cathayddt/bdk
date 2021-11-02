import fs from 'fs'
import prompts from 'prompts'
import { Arguments, Argv } from 'yargs'
import { onCancel, ParamsError } from '../../../util'
import { OrgJsonType } from '../../../model/type/org.type'
import Org from '../../../service/org'
import config from '../../../config'

export const command = 'import'

export const desc = '匯入 Org 的 json 設定檔'

interface OptType {
  interactive: boolean
  fileList: string[]
  orgCount: number
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk org config import --interactive', 'Cathay BDK 互動式問答')
    .example('bdk org config import --file ./test-import-config.json', '使用 ./test-import-config.json 匯入 org 至 Blockchain network 的資料夾底下')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('file-list', { type: 'array', description: '需要的參數設定 json 檔案路徑', alias: 'f' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const org = new Org(config)

  const orgJsonList: OrgJsonType[] = await (async () => {
    if (argv.fileList) {
      const inputOrgJson: OrgJsonType[] = []

      argv.fileList.forEach(file => inputOrgJson.push(JSON.parse(fs.readFileSync(file).toString())))

      return inputOrgJson
    } else if (argv.interactive) {
      const orgCount: number = await (async () => {
        return (await prompts([
          {
            type: 'number',
            name: 'orgCount',
            message: 'How many org do you want to add?',
            min: 1,
            initial: 1,
          },
        ], { onCancel })).orgCount
      })()

      const orgJsons: OrgJsonType[] = []
      for (let i = 0; i < orgCount; i++) {
        const orgJson = await prompts([
          {
            type: 'text',
            name: 'orgName',
            message: `What is peer org ${i} name?`,
            initial: 'Test',
          },
          {
            type: 'select',
            name: 'orgType',
            message: `What is peer org ${i} type?`,
            choices: [
              { title: 'Orderer', value: 'Orderer' },
              { title: 'Peer', value: 'Peer' },
            ],
            initial: 1,
          },
          {
            type: 'text',
            name: 'jsonFile',
            message: `What is peer org ${i} json file path?`,
          },
        ], { onCancel })

        orgJsons.push({
          name: orgJson.orgName,
          json: JSON.parse(fs.readFileSync(orgJson.jsonFile).toString()),
        })
      }

      return orgJsons
    }

    throw new ParamsError('Invalid params: Required parameter missing')
  })()

  org.importConfig(orgJsonList)
}
