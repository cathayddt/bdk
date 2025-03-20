import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Contract, { getFileChoices } from '../../service/contract'
import { onCancel, ParamsError } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'
import { FileFormat } from '../../model/type/file.type'
import { tarDateFormat } from '../../../util/utils'


export const command = 'deploy'

export const desc = '部屬 Solidity 合約'

interface OptType {
    interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
    return yargs
        .example('bdk eth contract compile --interactive', 'Cathay BDK 互動式問答')
        .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
}

export const handler = async (argv: Arguments<OptType>) => {
    if (!argv.interactive) throw new ParamsError('Invalid params: Required parameter missing');

    const { networkType } = await prompts([
        {
            type: 'select',
            name: 'networkType',
            message: 'What is your network?',
            choices: getNetworkTypeChoices(),
        },
    ], { onCancel })
    const contract = new Contract(config, networkType)
    
    //deploy contract Folder
    const { contractFolderPath } = await prompts({
        type: 'text',
        name: 'contractFolderPath',
        message: 'What is the folder path of deploy contract?',
    }, { onCancel });

    //select deploy contract
    const { contractFilePath } = await prompts({
        type: 'select',
        name: 'contractFilePath',
        message: 'What is the name of deploy contract?',
        choices: await getFileChoices(contractFolderPath, FileFormat.JSON),
    }, { onCancel });

    
    const questions = await contract.getParametersFromABI(contractFilePath);
    let params: any = [];
    if (questions.length > 0) {
        params = await prompts(questions, { onCancel });
        for (const key in params) {
            if (typeof params[key] === 'string' && params[key].startsWith('[') && params[key].endsWith(']')) {
                params[key] = JSON.parse(params[key]);
            }
        }
    }

    const { privateKey } = await prompts({
        type: 'text',
        name: 'privateKey',
        message: 'What is the account private key of deploy contract?',
    }, { onCancel });

    const spinner = ora('Contract Deploy ...').start()
    
    // Besu/Quorum deploy contract
    const contractAddress = await contract.deploy(contractFilePath, privateKey, params)
    contract['bdkFile'].createContractAddress(`${contractFilePath.split('/').pop()?.split('.')[0]}_${tarDateFormat(new Date())}`, contractAddress.toString())
    
    spinner.succeed(`Contract Deploy Successfully! Address at: ${contractAddress}`)
}

