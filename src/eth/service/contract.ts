import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { FileFormat } from '../model/type/file.type';
import { NotFoundWarn, PathError, SolcError } from '../../util/error'
import { PromptObject } from 'prompts'
import { logger } from '../../util';
import { ContractABI, ABIComponent, ABIPrimitiveType, ABIArrayType, ABIResult } from '../model/type/abi.type'
import { isAddress } from 'ethers'
// @ts-ignore
import solc from "solc";
import { execSync } from "child_process";

// /**
//  * 檢查本地 solc 是否能正常運行，並檢查是否安裝指定版本。
//  * @param {string} version - 指定的 solc 版本（例如 '0.8.20'）
//  * @returns {boolean} - 是否有指定版本的 solc，並且 solc 能正常運行
//  */
// function checkSolcVersion(version?: string): boolean {
//     try {
//       // 檢查是否能執行 solc 指令
//       const solcVersionOutput = execSync('solc --version', { encoding: 'utf-8' });

//       if (solcVersionOutput.includes(version)) {
//         console.log(`✅ solc version ${version} 已安裝並正常運行！`);
//         return true;
//       } else {
//         console.error(`❌ solc 版本不符合指定版本，當前版本為：${solcVersionOutput}`);
//         return false;
//       }
//     } catch (error) {
//       console.error('❌ solc 指令無法運行，請確保 solc 已安裝並且可執行。');
//       return false;
//     }
//   }


function checkSolcAvailability(): void {
    try {
        // 嘗試執行 `solc --version` 來檢查是否可用
        const result = execSync('solc --version', { encoding: 'utf-8' });
        console.log('✅ solc is available:', result.trim());
    } catch (error: unknown) {
        throw new SolcError('❌ solc is not available');
    }
}

async function bdkSolcCompile(contractFolderPath: string, filename: string): Promise<void> {
    try {
        const contractPath = path.resolve(contractFolderPath, filename);
        const source = fs.readFileSync(contractPath, "utf8");

        // build Solc Compile input
        const input = {
            language: "Solidity",
            sources: {
                [filename]: { content: source }, // 使用 filename 作為 key
            },
            settings: {
                outputSelection: {
                    "*": {
                        "*": ["abi", "evm.bytecode.object"],
                    },
                },
            },
        };

        // Compile the contract
        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        if (output.errors) {
            throw new SolcError("❌ Solidity Compile Error:", output.errors);
        }


        // 建立 build 目錄
        const buildDir = path.resolve(contractFolderPath, "build");
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
        }

        // 取得所有合約名稱（可能有多個）
        const contracts = output.contracts[filename];
        if (!contracts) {
            throw new NotFoundWarn(`❌ No contracts found in ${filename}`);
        }

        // 遍歷所有合約
        for (const contractName in contracts) {
            const contractData = contracts[contractName];

            const abi = contractData.abi;
            const bytecode = contractData.evm.bytecode.object;

            // 儲存 ABI 和 Bytecode
            fs.writeFileSync(
                path.join(buildDir, `${contractName}.json`),
                JSON.stringify({ abi, bytecode }, null, 2)
            );

            console.log(`✅ Contract ${contractName} has been compiled and the result has been saved in ${contractFolderPath}/build/${contractName}.json`);
        }
    } catch (error) {
        throw new SolcError("❌ An error occurred during compilation:");
    }
}

async function localSolcCompile(contractFolderPath: string, filename: string) {
    // 執行本地 solc 命令
    const contractPath = path.resolve(contractFolderPath, filename);
    const output = execSync(`solc --combined-json abi,bin ${contractPath}`).toString();
    // console.log("output",output);
    const parsedOutput = JSON.parse(output);

    // 確保 `build/` 目錄存在
    const buildDir = path.resolve(contractFolderPath, "build");
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
    }

    // 取得所有合約
    const contracts = parsedOutput.contracts;
    for (const contractKey in contracts) {
        const contractData = contracts[contractKey];
        const contractName = contractKey.split(":").pop(); // 取得合約名稱

        if (!contractName) continue;

        const abi = contractData.abi;
        const bytecode = contractData.bin;

        // 儲存 ABI 和 Bytecode
        const outputFile = path.join(buildDir, `${contractName}.json`);
        fs.writeFileSync(outputFile, JSON.stringify({ abi, bytecode }, null, 2));

        console.log(`✅ Contract ${contractName} has been compiled and the result has been saved in ${outputFile}`);
    }
}

export async function compileContract(contractFolderPath: string, contractFilePath: string, compileFunction: string) {
    console.log(contractFilePath, compileFunction);
    switch (compileFunction) {
        case 'bdkSolc':
            console.log('Compiling with bdk\'s solc (version 0.8.17)');
            bdkSolcCompile(contractFolderPath, contractFilePath);
            break;
        case 'localSolc':
            console.log('Compiling with local solc');
            checkSolcAvailability();
            localSolcCompile(contractFolderPath, contractFilePath);
            break;
        default:
            console.log('Invalid selection');
            break;
    }
}

export async function getParametersFromABI(abi: ContractABI): Promise<PromptObject[]> {
    const constructorAbi = abi.find(item => item.type === "constructor");
    if (!constructorAbi || !constructorAbi.inputs?.length) return [];

    const inputs = constructorAbi.inputs;

    function getPromptType(type: string): PromptObject['type'] {
        if (type.endsWith("[]")) return 'text';
        if (type.startsWith("uint") || type.startsWith("int")) return 'number';
        if (type === "bool") return 'toggle';
        if (type === "address" || type === "string" || type.startsWith("bytes")) return 'text';
        return 'text';
    }

    function parseTuple(input: ABIComponent, parentName = ""): ABIResult {
        if (!input.components || !Array.isArray(input.components)) {
            return [];
        }
        const fieldName = parentName ? `${parentName}.${input.name}`.replace(/\.+$/, '') : input.name;

        return input.components.map((component) => {
            if (component.type === "tuple") {
                return parseTuple(component, fieldName);
            }
            return component.type as ABIPrimitiveType | ABIArrayType;
        });
    }

    const questions: PromptObject[] = inputs.flatMap(input => {
        if (input.type === "tuple")
            return [{
                type: getPromptType(input.type),
                name: input.name,
                message: `Please enter ${input.name} (${input.type}) ex:${JSON.stringify(parseTuple(input, input.name))}`,
                validate: (value: any) => {
                    try {
                        const parsedValue = JSON.parse(value);
                        return true;
                    } catch (e) {
                        return "Invalid input format. Please ensure you enter a valid JSON format.";
                    }
                }
            }] as any;
        else return [{
            type: getPromptType(input.type),
            name: input.name,
            message: `Please enter ${input.name} (${input.type})`,
            validate: (value: any) => {
                if (input.type === "address" && !isAddress(value)) {
                    return "Please enter a valid Ethereum address.";
                }
                return true;
            }
        }] as any;
    });

    return questions;
}

export const getFileChoices = async (contractFolderPath: string, fileFormat: FileFormat) => {
    try {
        // 檢查資料夾是否存在
        if (!fs.existsSync(contractFolderPath)) {
            throw new PathError(`❌ Folder not found: ${contractFolderPath}`);
        }

        // 讀取資料夾內的所有檔案
        const files = fs.readdirSync(contractFolderPath);

        // 篩選出對應格式的檔案
        let filterFiles: string[] = [];
        switch (fileFormat) {
            case FileFormat.JSON:
                filterFiles = files.filter(file => file.endsWith('.json'));
                break;
            case FileFormat.SOL:
                filterFiles = files.filter(file => file.endsWith('.sol'));
                break;
            case FileFormat.ABI:
                filterFiles = files.filter(file => file.endsWith('.abi'));
                break;
            case FileFormat.BIN:
                filterFiles = files.filter(file => file.endsWith('.bin'));
                break;
            default:
                throw new NotFoundWarn(`⚠️ Not find file format: ${fileFormat}`);
        }

        // 檢查是否有可用的合約
        if (filterFiles.length === 0) {
            throw new NotFoundWarn('⚠️ No matching contract files found!');
        }

        // 轉換為 prompts 需要的格式
        return filterFiles.map(file => ({
            title: file,
            value: path.join(contractFolderPath, file),
        }));
    } catch (error) {
        if (error instanceof PathError || error instanceof NotFoundWarn) {
            logger.warn(error.message);
        }
        return [];
    }
};


export const deployContract = async (contractFilePath: string, privateKey: string, params: any) => {
    const contractJson = JSON.parse(fs.readFileSync(contractFilePath, "utf8"));
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const wallet = new ethers.Wallet(privateKey, provider);
    let abi = contractJson.abi;
    let bytecode = contractJson.bytecode;

    const factory = new ethers.ContractFactory(
        abi,
        bytecode,
        wallet
    );
    const contract = params ? await factory.deploy(...Object.values(params)) : await factory.deploy();
    // console.log("部署合约的交易详情", contract.deploymentTransaction())
    await contract.waitForDeployment()
    console.log("合约已部署上链")
    //TODO: Save contract address to file
    //TODO: When Remove blockchain remove contract address from file 
    return contract.target;
};




