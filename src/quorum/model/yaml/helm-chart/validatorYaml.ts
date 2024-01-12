import HelmChartYaml from './helmChartYaml'

class ValidatorConfigYaml extends HelmChartYaml {
  public setQuorumFlags () {
    this.setService('quorumFlags', {
      privacy: false,
      removeKeysOnDelete: false,
      isBootnode: false,
      usesBootnodes: false,
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
          memRequest: '0.5G',
        },
      },
    })
  }
}

export default ValidatorConfigYaml
