/* global describe, it */
import assert from 'assert'
import Wallet from '../../../src/wallet/service/wallet'
import { WalletCreateType, WalletType } from '../../../src/wallet/model/type/wallet.type'

// write a test for the wallet class
describe('Wallet.Create', function () {
  this.timeout(1000)
  const wallet = new Wallet()

  // create a new ethereum wallet
  describe('Wallet.Create', () => {
    it('should create a ethereum wallet with address and private key', () => {
      const WalletCreateType: WalletCreateType = {
        type: WalletType.ETHEREUM,
      }
      const result = wallet.create(WalletCreateType)

      assert(result.length > 0, 'Wallet create error')
    })
  })
})
