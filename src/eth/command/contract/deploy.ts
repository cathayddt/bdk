import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Network from '../../service/network'
import { getContractChoices, deployContract } from '../../service/contract'
import { onCancel, ParamsError, ProcessError } from '../../../util/error'
import prompts, {PromptObject} from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'
import { ContractABI } from '../../model/type/abi.type'
import fs from 'fs';

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

async function getParametersFromABI(abi: ContractABI) {
    // 找到 constructor 這一項
    const constructorAbi = abi.find(item => item.type === "constructor");

    // 如果找不到 constructor 或是沒有輸入參數，返回空物件
    if (!constructorAbi || constructorAbi.inputs?.length === 0) return [];

    // 取得所有輸入參數
    const inputs = constructorAbi.inputs;

    // 生成每個參數的問題，確保是符合 prompts 要求的格式
  const questions: PromptObject[] = inputs.map(input => ({
    type: input.type === "string" ? 'text' : 'number', // 判斷類型
    name: input.name,  // 問題名稱使用輸入參數的名稱
    message: `請輸入 ${input.name} (${input.type})` // 顯示提示語
  }));

    return questions;
}

export const handler = async (argv: Arguments<OptType>) => {
    const { networkType } = await prompts([
        {
            type: 'select',
            name: 'networkType',
            message: 'What is your network?',
            choices: getNetworkTypeChoices(),
        },
    ])
    const networkTypeWithBigFirstLetter = networkType.charAt(0).toUpperCase() + networkType.slice(1)
    const network = new Network(config, networkType)
    // console.log('network', network)

    //select deploy contract
    const { contractFilePath } = await prompts({
        type: 'select',
        name: 'contractFilePath',
        message: 'What is the name of deploy contract?',
        choices: await getContractChoices(),
    });
    console.log('response', contractFilePath)

    const { privateKey } = await prompts({
        type: 'text',
        name: 'privateKey',
        message: 'What is the account private key of deploy contract?',
    });


    const contractJson = JSON.parse(fs.readFileSync(contractFilePath, "utf8"));


    const abi = contractJson.abi;
    const questions = await getParametersFromABI(abi);
    let params;
    if (questions.length > 0) {
        params = await prompts(questions);
        // console.log('用戶輸入的參數:', params);
    } 
    // Quorum deploy contract

    await deployContract(contractFilePath, privateKey, params)
    // TODO: Besu deploy contract
}

