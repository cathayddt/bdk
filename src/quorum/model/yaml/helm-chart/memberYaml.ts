import HelmChartYaml from './helmChartYaml'

class MemberConfigYaml extends HelmChartYaml {
  public setQuorumFlags () {
    this.setService('quorumFlags', {
      privacy: true,
      removeKeysOnDelete: true,
      isBootnode: false, // Besu only, set this to true if this node is a bootnode
      usesBootnodes: false, // Besu only, set this to true if the network you are connecting to use a bootnode/s that are deployed in the cluster
    })
  }

  public setCluster () {
    const clusterConfig = {
      provider: 'local',
      cloudNativeServices: false,
    }

    this.setService('cluster', clusterConfig)
  }

  public setProvider (provider: string) {
    const providers: { [key: string]: any } = {
      aws: {
        serviceAccountName: 'quorum-sa',
        region: 'ap-southeast-2',
      },
      azure: {
        serviceAccountName: 'quorum-sa',
        identityClientId: 'azure-clientId',
        keyvaultName: 'azure-keyvault',
        tenantId: 'azure-tenantId',
        subscriptionId: 'azure-subscriptionId',
      },
    }

    this.setService(provider, providers[provider])
  }

  public setNode () {
    this.setService('node', {
      goquorum: {
        metrics: {
          serviceMonitorEnabled: false,
        },
        resources: {
          cpuLimit: 1,
          cpuRequest: 0.1,
          memLimit: '2G',
          memRequest: '1G',
        },
        account: {
          password: 'password',
        },
      },
      tessera: {
        resources: {
          cpuLimit: 1,
          cpuRequest: 0.5,
          memLimit: '2G',
          memRequest: '1G',
        },
        password: 'password',
      },
    })
  }
}

export default MemberConfigYaml
