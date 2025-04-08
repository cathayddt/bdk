import { Argv, Arguments } from 'yargs'
import config from '../../config'
import { onCancel, ParamsError } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import Contract, { getFileChoices } from '../../service/contract'

import { FileFormat } from '../../model/type/file.type'
import { CompileType } from '../../model/type/compile.type'

export const command = 'compile'
export const desc = '編譯 Solidity 合約'

interface OptType {
  interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk eth contract compile --interactive', 'Cathay BDK 互動式問答')
    .option('interactive', {
      type: 'boolean',
      description: '是否使用 Cathay BDK 互動式問答',
      alias: 'i',
    })
}

export const handler = async (argv: Arguments<OptType>) => {
  if (!argv.interactive) throw new ParamsError('Invalid params: Required parameter missing')

  const { contractFolderPath } = await prompts({
    type: 'text',
    name: 'contractFolderPath',
    message: 'What is the folder path of the contract you want to compile?',
  }, { onCancel })

  const choices = await getFileChoices(contractFolderPath, FileFormat.SOL)
  if (choices.length === 0) throw new ParamsError('No Solidity (.sol) files found in the specified folder.')

  // 選擇要編譯的合約檔案
  const { contractFilePath } = await prompts({
    type: 'select',
    name: 'contractFilePath',
    message: 'Which contract file do you want to compile?',
    choices,
  }, { onCancel })

  // 選擇編譯方式
  const { compileFunction } = await prompts({
    type: 'select',
    name: 'compileFunction',
    message: 'Which compiler do you want to use?',
    choices: [
      {
        title: 'BDK solc (version 0.8.17)',
        value: CompileType.BDK_SOLC,
        description: 'Uses BDK\'s pre-installed solc version 0.8.17',
      },
      {
        title: 'Local solc',
        value: CompileType.LOCAL_SOLC,
        description: 'Uses the solc version installed on your machine',
      },
    ],
  }, { onCancel })

  const spinner = ora('Contract compiling...').start()

  const contract = new Contract(config, 'quorum')
  await contract.compile(contractFolderPath, contractFilePath, compileFunction)

  spinner.succeed(`Contract compiled successfully! Output at: ${contractFolderPath}/build`)
}
