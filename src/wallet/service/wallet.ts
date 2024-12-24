import { ethers, HDNodeWallet } from 'ethers'
import { WalletCreateType, WalletType } from '../model/type/wallet.type'

export default class Wallet {
  /**
   * @description 建立 eth network
   */
  public create (walletCreateConfig: WalletCreateType) {
    const { address, privateKey } = this.createWalletAddress(walletCreateConfig.type)
    const walletAddress = address
    const result = `🔑 Your ${walletCreateConfig.type} wallet address: 0x${walletAddress}\n 🔑 Wallet private key: ${privateKey}`
    return result
  }

  /** @ignore */
  public createWalletAddress (type: WalletType) {
    let nodekey: HDNodeWallet
    let privateKey: string
    let publicKey: string
    let address: string

    switch (type) {
      case WalletType.ETHEREUM:
        nodekey = ethers.Wallet.createRandom()
        privateKey = nodekey.privateKey.replace(/^0x/, '')
        publicKey = nodekey.signingKey.publicKey.replace(/^0x04/, '')
        address = nodekey.address.replace(/^0x/, '').toLowerCase()
        break
    }

    return { privateKey, publicKey, address }
  }
}
