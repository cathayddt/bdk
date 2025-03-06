interface ABIInput {
  name: string;
  type: string;
  inputs: { name: string; type: string;[key: string]: any; }[];
  [key: string]: any;
}

interface ABIConstructor {
  type: "constructor";
  inputs: ABIInput[];
  [key: string]: any;
}

interface ABIAll {
  [key: string]: any;
}



type ABIItem = | ABIConstructor;

export type ContractABI = ABIItem[];
