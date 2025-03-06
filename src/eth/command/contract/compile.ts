import { Argv, Arguments } from 'yargs'
import config from '../../config'
import Network from '../../service/network'
import { onCancel, ParamsError, ProcessError } from '../../../util/error'
import prompts from 'prompts'
import ora from 'ora'
import { getNetworkTypeChoices } from '../../config/network.type'

export const command = 'compile'

export const desc = '編譯 Solidity 合約'

interface OptType {
    interactive: boolean
}

export const builder = (yargs: Argv<OptType>) => {
    return yargs
        .example('bdk eth contract compile --interactive', 'Cathay BDK 互動式問答')
        .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
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
}

// const fs = require("fs").promises;
// const solc = require("solc");

// async function main() {
//     // Load the contract source code
//     const sourceCode = await fs.readFile("./contracts/SimpleStorage.sol", "utf8");
//     // Compile the source code and retrieve the ABI and bytecode
//     const { abi, bytecode } = compile(sourceCode, "SimpleStorage");
//     // Store the ABI and bytecode into a JSON file
//     const artifact = JSON.stringify({ abi, bytecode }, null, 2);
//     await fs.writeFile("./build/SimpleStorage.json", artifact);
// }

// function compile(sourceCode, contractName) {
//     // Create the Solidity Compiler Standard Input and Output JSON
//     const input = {
//         language: "Solidity",
//         sources: { main: { content: sourceCode } },
//         settings: {
//             outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
//         },
//     };

//     try {
//         // Compile the Solidity code
//         const output = JSON.parse(solc.compile(JSON.stringify(input)));

//         // Check for compilation errors
//         if (output.errors) {
//             output.errors.forEach((error) => {
//                 console.error("Error:", error.formattedMessage);
//             });
//             throw new Error("Compilation failed");
//         }

//         // Ensure that the contractName exists in the compiled output
//         if (!output.contracts.main[contractName]) {
//             throw new Error(`Contract ${contractName} not found in the compilation output`);
//         }

//         // Parse the ABI and bytecode from the compiled output
//         const artifact = output.contracts.main[contractName];
//         return {
//             abi: artifact.abi,
//             bytecode: artifact.evm.bytecode.object,
//         };
//     } catch (error) {
//         console.error("Compilation error:", error.message);
//         return null;
//     }
// }

// main().then(() => process.exit(0));