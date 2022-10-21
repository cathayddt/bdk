/**
 * @requires name - [string] orderer org 的名稱
 * @requires domain - [string] orderer org 的 domain 名稱
 * @requires enableNodeOUs - [boolean] orderer org 的 member 中是否再細分身份
 * @requires hostname - [string array]] orderer 的 hostname 名稱
 */
export interface NetworkCryptoConfigValidatorType {
  name: string
  domain: string
  enableNodeOUs: boolean
  hostname: string[]
}

export interface NetworkCryptoConfigMemberType {
  name: string
  domain: string
  enableNodeOUs: boolean
  memberCount: number
  userCount: number
}

/**
 * @requires port - [number] peer 機器的 port
 * @requires operationPort - [number] peer 機器觀測有無連線的 port
 * @requires isPublishPort - [boolean] 是否公開 peer 機器的 port
 * @requires isPublishOperationPort - [boolean] 是否公開 peer 機器觀測有無連線的 port
 */
export interface NetworkMemberPortType {
  port: number
  operationPort: number
  isPublishPort: boolean
  isPublishOperationPort: boolean
}

export interface NetworkValidatorPortType {
  port: number
  operationPort: number
  isPublishPort: boolean
  isPublishOperationPort: boolean
}

/**
 * @requires name - [string] orderer org 的名稱
 * @requires domain - [string] orderer org 的 domain 名稱
 * @requires enableNodeOUs - [boolean] orderer org 的 member 中是否再細分身份
 * @requires hostname - [string array] orderer 的 hostname 名稱
 * @requires ports - [{@link NetworkValidatorPortType} array] orderer org 中 port 設定
 */
export interface NetworkCreateValidatorType extends NetworkCryptoConfigValidatorType {
  ports?: NetworkValidatorPortType[]
}

/**
 * @requires name - [string] peer org 的名稱
 * @requires domain - [string] peer org 的 domain 名稱
 * @requires enableNodeOUs - [boolean] peer org 的 member 中是否再細分身份
 * @requires memberCount - [number] peer org 中有幾個 peer
 * @requires userCount - [number] peer org 中有幾個 user
 * @requires ports - [{@link NetworkMemberPortType} array] peer org 中 port 設定
 */
export interface NetworkCreateMemberType extends NetworkCryptoConfigMemberType {
  ports?: NetworkMemberPortType[]
}

/**
 * @requires validators - [{@link NetworkCreateValidatorType} number]
 * @requires members - [{@link NetworkCreateMemberType} number]
 */

export interface NetworkCreateType {
  chainId: number
  validatorNumber: number
  memberNumber: number
  alloc: {
    account: string
    amount: string
  }[]
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
      epochLength: number
      blockPeriodSeconds: number
      emptyBlockPeriodSeconds: number
      requestTimeoutSeconds: number
      policy: number
      ceil2Nby3Block: number
    }
    txnSizeLimit: number
    maxCodeSize: number
    isQuorum: boolean
  }
  alloc: {
    [key: string]: Alloc
  }
}
