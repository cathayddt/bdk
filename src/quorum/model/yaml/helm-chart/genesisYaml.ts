import HelmChartYaml from './helmChartYaml'

class GenesisConfigYaml extends HelmChartYaml {
  public setCluster () {
    this.setQuorumFlags({
      privacy: false,
      removeKeysOnDelete: false,
      isBootnode: false,
      usesBootnodes: false,
    })
  }

  public setGenesis () {
    const genesisConfig = {
      genesis: {
        config: {
          chainId: 1337,
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
          count: 4,
        },
        accountPassword: 'password',
      },
    }
    this.setService('rawGenesisConfig', genesisConfig)
  }
}

export default GenesisConfigYaml
