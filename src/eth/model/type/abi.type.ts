export type ABIPrimitiveType = 'uint256' | 'int256' | 'bool' | 'address' | 'string' | `bytes${number | ''}`;

export type ABIArrayType = `${ABIPrimitiveType}[]`;
export type ABIResult = (ABIPrimitiveType | ABIArrayType | ABIResult)[];

export type ABIType = ABIPrimitiveType | `${ABIPrimitiveType}[]` | 'tuple' | 'tuple[]';

export interface ABIComponent {
  name: string
  type: ABIType
  components?: ABIComponent[]
  [key: string]: any
}

export type ContractABI = {
  inputs: ABIComponent[]
  stateMutability?: string
  type: 'constructor' | 'function' | 'event'
  name?: string
  outputs?: ABIComponent[]
  [key: string]: any
}[];
