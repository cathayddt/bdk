import { NetworkCreateType } from './type/network.type'
import ora from 'ora'

export function defaultNetworkConfig (networkType: string, address: string, privateKey: string) {
  ora().stopAndPersist({
    text: `Your wallet address: 0x${address}`,
    symbol: '🔑',
  })
  ora().stopAndPersist({
    text: `Wallet private key: ${privateKey}`,
    symbol: '🔑',
  })

  const networkConfig: NetworkCreateType = {
    networkType: networkType,
    chainId: 81712,
    validatorNumber: 4,
    memberNumber: 0,
    alloc: [{
      account: address,
      amount: '1000000000000000000000000000',
    }],
    isBootNode: false,
    bootNodeList: [],
  }

  return networkConfig
}
