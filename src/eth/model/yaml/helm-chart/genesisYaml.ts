import HelmChartYaml from './helmChartYaml'

class GenesisConfigYaml extends HelmChartYaml {
  public setGenesis(chainID: number, nodeCount: number, networkType: 'besu' | 'quorum') {
    this.setQuorumFlags({
      privacy: false,
      removeKeysOnDelete: false,
      isBootnode: false,
      usesBootnodes: false,
    })

    const baseGenesisConfig: {
      genesis: {
        config: {
          chainId: number;
          algorithm: {
            consensus: string;
            blockperiodseconds: number;
            epochlength: number;
            requesttimeoutseconds: number;
            emptyBlockPeriod?: number;
          };
          difficulty: string;
          coinbase: string;
          gasLimit?: string;
        };
        nonce?: string;
      };
      blockchain: {
        nodes: {
          generate: boolean;
          count: number;
        };
        accountPassword: string;
      };
    } = {
      genesis: {
        config: {
          chainId: chainID,
          algorithm: {
            consensus: 'qbft',
            blockperiodseconds: 1,
            epochlength: 30000,
            requesttimeoutseconds: 60,
          },
          gasLimit: '0xE0000000',
          difficulty: '0x1',
          coinbase: '0x0000000000000000000000000000000000000000',
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

    if (networkType === 'quorum') {
      baseGenesisConfig.genesis.config.algorithm.emptyBlockPeriod = 3600
      baseGenesisConfig.genesis.nonce = '0x0'
    }

    this.setService('rawGenesisConfig', baseGenesisConfig)
  }
}

export default GenesisConfigYaml