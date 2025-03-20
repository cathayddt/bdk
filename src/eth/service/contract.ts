import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import {AbstractService} from './Service.abstract'
import { FileFormat } from '../model/type/file.type';
import { NotFoundWarn, PathError, SolcError } from '../../util/error'
import { PromptObject } from 'prompts'
import { logger } from '../../util';
import { ContractABI, ABIComponent, ABIPrimitiveType, ABIArrayType, ABIResult } from '../model/type/abi.type'
import { isAddress } from 'ethers'
// @ts-ignore
import solc from "solc";
import { execSync } from "child_process";

export const getFileChoices = async (contractFolderPath: string, fileFormat: FileFormat) => {
    try {
        if (!fs.existsSync(contractFolderPath)) {
            throw new PathError(`❌ Folder not found: ${contractFolderPath}`);
        }

        const files = fs.readdirSync(contractFolderPath);

        // Filter out files in the corresponding format
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

        if (filterFiles.length === 0) {
            throw new NotFoundWarn('⚠️ No matching contract files found!');
        }

        // Convert to the format required by prompts
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

export default class Contract extends AbstractService {
    /**
     * @description compile contract
     * @param contractFolderPath 
     * @param contractFilePath 
     * @param compileFunction 
     */
    public async compile(contractFolderPath: string, contractFilePath: string, compileFunction: string) {
        switch (compileFunction) {
            case 'bdkSolc':
                this.bdkSolcCompile(contractFolderPath, contractFilePath);
                break;
            case 'localSolc':
                this.checkSolcAvailability();
                this.localSolcCompile(contractFolderPath, contractFilePath);
                break;
            default:
                logger.debug('Invalid selection');
                break;
        }
    }
    
    /**
     * 
     * @description deploy contract
     * @param contractFilePath 
     * @param privateKey 
     * @param params 
     * @returns 
     */
    public async deploy (contractFilePath: string, privateKey: string, params: any) {
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
        await contract.waitForDeployment()
        logger.debug("合约已部署上链")
        //TODO: When Remove blockchain remove contract address from file 
        return contract.target;
    };
    
    /**
   * @description get contract address
   */
    public async get(contractName: string) {
        
    }
    
    private generateOptions() {
        
    }

    private checkSolcAvailability(): void {
        try {
            // 嘗試執行 `solc --version` 來檢查是否可用
            const result = execSync('solc --version', { encoding: 'utf-8' });
            logger.debug('✅ solc is available:', result.trim());
        } catch (error: unknown) {
            throw new SolcError('❌ solc is not available');
        }
    }
    
    private async bdkSolcCompile(contractFolderPath: string, filename: string): Promise<void> {
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
    
            const buildDir = path.resolve(contractFolderPath, "build");
            if (!fs.existsSync(buildDir)) {
                fs.mkdirSync(buildDir, { recursive: true });
            }
    
            const contracts = output.contracts[filename];
            if (!contracts) {
                throw new NotFoundWarn(`❌ No contracts found in ${filename}`);
            }
    
            // Traverse all contracts
            for (const contractName in contracts) {
                const contractData = contracts[contractName];
    
                const abi = contractData.abi;
                const bytecode = contractData.evm.bytecode.object;
    
                fs.writeFileSync(
                    path.join(buildDir, `${contractName}.json`),
                    JSON.stringify({ abi, bytecode }, null, 2)
                );
    
                logger.debug(`✅ Contract ${contractName} has been compiled and the result has been saved in ${contractFolderPath}/build/${contractName}.json`);
            }
        } catch (error) {
            throw new SolcError("❌ An error occurred during compilation:");
        }
    }
    
    private async localSolcCompile(contractFolderPath: string, filename: string) {
        // Execute the local solc command
        const contractPath = path.resolve(contractFolderPath, filename);
        const output = execSync(`solc --combined-json abi,bin ${contractPath}`).toString();
        const parsedOutput = JSON.parse(output);
    
        const buildDir = path.resolve(contractFolderPath, "build");
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
        }
    
        // get contracts
        const contracts = parsedOutput.contracts;
        for (const contractKey in contracts) {
            const contractData = contracts[contractKey];
            const contractName = contractKey.split(":").pop(); // 取得合約名稱
    
            if (!contractName) continue;
    
            const abi = contractData.abi;
            const bytecode = contractData.bin;
    
            const outputFile = path.join(buildDir, `${contractName}.json`);
            fs.writeFileSync(outputFile, JSON.stringify({ abi, bytecode }, null, 2));
    
            logger.debug(`✅ Contract ${contractName} has been compiled and the result has been saved in ${outputFile}`);
        }
    }

    public async getParametersFromABI(contractFilePath: string): Promise<PromptObject[]> {
        const contractJson = JSON.parse(fs.readFileSync(contractFilePath, "utf8"));
        const abi: ContractABI = contractJson.abi;
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
}






