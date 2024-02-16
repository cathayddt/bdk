import HelmChartYaml from './helmChartYaml'

class MemberConfigYaml extends HelmChartYaml {
  public setQuorumConfigs (metrics = false) {
    this.setQuorumFlags({
      privacy: false,
      removeKeysOnDelete: false,
      isBootnode: false,
      usesBootnodes: false,
    })

    this.setNode({
      goquorum: {
        metrics: {
          // default value in helm is true
          serviceMonitorEnabled: metrics,
        },
        resources: {
          cpuLimit: 1,
          cpuRequest: 0.1,
          memLimit: '2G',
          memRequest: '0.5G',
        },
        account: {
          password: 'password',
        },
      },
    })
  }
}

export default MemberConfigYaml
