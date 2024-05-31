import BdkYaml from '../bdkYaml'
import { GenesisJsonType } from '../../type/network.type'

class GenesisJsonYaml extends BdkYaml<GenesisJsonType> {
  constructor (value?: GenesisJsonType) {
    // dafault value in besu node genesis.json
    super(value || {
      nonce: '0x0',
      timestamp: `0x${Math.floor(Date.now() / 1000).toString(16)}`,
      extraData: '0x0',
      gasLimit: '0xE0000000',
      gasUsed: '0x0',
      number: '0x0',
      difficulty: '0x1',
      coinbase: '0x0000000000000000000000000000000000000000',
      mixHash: '0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365',
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      config: {
        chainId: 81712,
        homesteadBlock: 0,
        eip150Block: 0,
        eip150Hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        eip155Block: 0,
        eip158Block: 0,
        byzantiumBlock: 0,
        constantinopleBlock: 0,
        petersburgBlock: 0,
        istanbulBlock: 0,
        qbft: {
          blockPeriodSeconds: 1,
          epochLength: 30000,
          requestTimeoutSeconds: 60,
        },
      },
      alloc: {},
    })
  }

  public addExtraData (extraData: string) {
    this.value.extraData = extraData
  }

  public addChainId (chainId: number) {
    this.value.config.chainId = chainId
  }

  public addAlloc (alloc: { [address: string]: { balance: string } }) {
    this.value.alloc = alloc
  }

  public addGasLimit (gasLimit: string) {
    this.value.gasLimit = gasLimit
  }
}

export default GenesisJsonYaml
