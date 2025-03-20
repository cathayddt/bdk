// base type
export type ABIPrimitiveType = "uint256" | "int256" | "bool" | "address" | "string" | `bytes${number | ""}`;

export type ABIArrayType = `${ABIPrimitiveType}[]`;
export type ABIResult = (ABIPrimitiveType | ABIArrayType | ABIResult)[];

// supported array types
export type ABIType = ABIPrimitiveType | `${ABIPrimitiveType}[]` | "tuple" | `tuple[]`;

// Recursive type: if it is a tuple, it may have internal components
export type ABIComponent = {
    name: string;
    type: ABIType;
    components?: ABIComponent[]; 
    [key: string]: any;
};

// 合約 ABI 結構
export type ContractABI = {
    inputs: ABIComponent[];
    stateMutability?: string;
    type: "constructor" | "function" | "event";
    name?: string;
    outputs?: ABIComponent[];
    [key: string]: any;
}[];