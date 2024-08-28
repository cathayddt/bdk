import HelmChartYaml from './helmChartYaml'
import { NetworkType } from '../../../config/network.type'

class GenesisConfigYaml extends HelmChartYaml {
  public setGenesis(networkType: NetworkType, chainID: number, nodeCount: number) {
    if (networkType === 'quorum') {
      this.setQuorumGenesis(chainID, nodeCount)
    } else if (networkType === 'besu') {
      this.setBesuGenesis(chainID, nodeCount)
    } else {
      throw new Error(`Unsupported network type: ${networkType}`)
    }
  }

  private setQuorumGenesis(chainID: number, nodeCount: number) {
    this.setQuorumFlags({
      privacy: false,
      removeKeysOnDelete: false,
      isBootnode: false,
      usesBootnodes: false,
    })

    const genesisConfig = {
      genesis: {
        config: {
          chainId: chainID,
          algorithm: {
            consensus: 'qbft',
            blockperiodseconds: 1,
            emptyBlockPeriod: 3600,
            epochlength: 30000,
            requesttimeoutseconds: 60,
          },
          gasLimit: '0xE0000000',
          difficulty: '0x1',
          coinbase: '0x0000000000000000000000000000000000000000',
          includeQuickStartAccounts: false,
        },
      },
      blockchain: {
        nodes: {
          generate: true,
          count: nodeCount,
        },
        accountPassword: 'password',
      },
    }
    this.setService('rawGenesisConfig', genesisConfig)
  }

  private setBesuGenesis(chainID: number, nodeCount: number) {
    const genesisConfig = {
      genesis: {
        config: {
          chainId: chainID,
          algorithm: {
            consensus: 'qbft',
            blockperiodseconds: 10,
            epochlength: 30000,
            requesttimeoutseconds: 20,
          },
        },
        gasLimit: '0xf7b760',
        difficulty: '0x1',
        coinbase: '0x0000000000000000000000000000000000000000',
      },
      blockchain: {
        nodes: {
          generate: true,
          count: nodeCount,
        },
        accountPassword: 'password',
      },
    }
    this.setService('rawGenesisConfig', genesisConfig)
  }
}

export default GenesisConfigYaml
