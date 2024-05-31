/**
 * @requires account - [string] wallet 地址
 * @requires amount - [string] 分配原生代幣數量
 */
export interface AllocType {
  account: string
  amount: string
}

/**
 * @requires chainId - [number] chain ID
 * @requires validatorNumber - [number] validator 數量
 * @requires memberNumber - [number] member 數量
 * @requires alloc - [{@link AllocType} array] 原生代幣分配設定
 */
export interface NetworkCreateType {
  chainId: number
  validatorNumber: number
  memberNumber: number
  alloc: AllocType[]
  isBootNode: boolean
  bootNodeList: boolean[]
}

interface Alloc {
  balance: string
  comment?: string
  privateKey?: string
}

export interface GenesisJsonType {
  nonce: string
  timestamp: string
  extraData: string
  gasLimit: string
  gasUsed: string
  number: string
  difficulty: string
  coinbase: string
  mixHash: string
  parentHash: string
  config: {
    chainId: number
    homesteadBlock: number
    eip150Block: number
    eip150Hash: string
    eip155Block: number
    eip158Block: number
    byzantiumBlock: number
    constantinopleBlock: number
    petersburgBlock: number
    istanbulBlock: number
    qbft: {
      blockPeriodSeconds: number
      epochLength: number
      requestTimeoutSeconds: number
    }
  }
  alloc: {
    [key: string]: Alloc
  }
}

export interface NetworkInfoItem {
  label: string
  value: string
}
