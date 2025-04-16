import HelmChartYaml from './helmChartYaml'

class GenesisConfigYaml extends HelmChartYaml {
  public setGenesis (chainID: number, nodeCount: number, alloc: { [address: string]: { balance: string } }) {
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
        alloc: alloc,
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
