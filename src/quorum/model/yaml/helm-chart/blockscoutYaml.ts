import HelmChartYaml from './helmChartYaml'

class BlockscoutConfigYaml extends HelmChartYaml {
  public setImage () {
    this.setService('image', {
      blockscout: {
        repository: 'consensys/blockscout',
        tag: 'v4.0.0-beta',
        pullPolicy: 'IfNotPresent',
      },
    })
  }

  public setPostgresql () {
    this.setService('postgresql', {
      postgresqlDatabase: 'postgres',
      postgresqlUsername: 'postgres',
      postgresqlPassword: 'postgres',
      initdbUser: 'postgres',
      initdbPassword: 'postgres',
      enabled: true,
    })
  }

  public setBlockscout () {
    this.setService('blockscout', {
      resources: {
        cpuLimit: 0.7,
        cpuRequest: 0.5,
        memLimit: '2G',
        memRequest: '1G',
      },
      port: 4000,
      database_url: 'ecto://postgres:postgres@blockscout-postgresql/postgres?ssl=false',
      postgres_password: 'postgres',
      postgres_user: 'postgres',
      network: 'quorum',
      subnetwork: 'consensys',
      chain_id: 1337,
      coin: 'eth',
      ethereum_jsonrpc_variant: 'geth',
      ethereum_jsonrpc_transport: 'http',
      ethereum_jsonrpc_endpoint: 'goquorum-node-member-1', // service name to be used
      secret_key_base: 'VTIB3uHDNbvrY0+60ZWgUoUBKDn9ppLR8MI4CpRz4/qLyEFs54ktJfaNT6Z221', // change me please
    })
  }
}

export default BlockscoutConfigYaml
