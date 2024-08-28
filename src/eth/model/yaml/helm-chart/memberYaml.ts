import HelmChartYaml from './helmChartYaml'
import { NetworkType } from '../../../config/network.type'

class MemberConfigYaml extends HelmChartYaml {
  public setMember(networkType: NetworkType, metrics = false) {
    if (networkType === 'quorum') {
      this.setQuorumConfigs(metrics)
    } else if (networkType === 'besu') {
      this.setBesuConfigs(metrics)
    } else {
      throw new Error(`Unsupported network type: ${networkType}`)
    }
  }

  private setQuorumConfigs (metrics = false) {
    this.setQuorumFlags({
      privacy: false,
      removeKeysOnDelete: false,
      isBootnode: false,
      usesBootnodes: false,
    })

    this.setQuorumNode({
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

  private setBesuConfigs(metrics = false) {
    this.setBesuFlags({
      privacy: false,
      removeKeysOnDelete: false,
      isBootnode: false,
      usesBootnodes: false,
    })

    this.setBesuNode({
      besu: {
        metrics: {
          serviceMonitorEnabled: metrics,
        },
        resources: {
          cpuLimit: 0.7,
          cpuRequest: 0.5,
          memLimit: '2G',
          memRequest: '1G',
        },
        account: {
          password: 'password',
        },
      },
    })
  }
}

export default MemberConfigYaml
