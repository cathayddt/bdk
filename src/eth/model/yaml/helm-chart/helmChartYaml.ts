import BdkYaml from '../bdkYaml'

interface ClusterInterface {
  provider: string
  cloudNativeServices: boolean
  reclaimPolicy?: string
}

interface quorumFlags {
  privacy: boolean
  removeKeysOnDelete: boolean
  isBootnode: boolean
  usesBootnodes: boolean
}

interface AwsInterface {
  serviceAccountName: string
  region: string
}

interface AzureInterface {
  serviceAccountName: string
  identityClientId: string
  keyvaultName: string
  tenantId: string
  subscriptionId: string
}

interface NodeInterface {
  goquorum: {
    metrics: {
      serviceMonitorEnabled: boolean
    }
    resources: {
      cpuLimit: number
      cpuRequest: number
      memLimit: string
      memRequest: string
    }
    account?: {
      password: string
    }
  }
  tessera?: {
    password: string
  }
}
export interface HelmChartYamlInterface {
  quorumFlags: quorumFlags
  cluster?: ClusterInterface
  aws?: AwsInterface
  azure?: AzureInterface
  node?: NodeInterface
  [key: string]: any
}

class HelmChartYaml extends BdkYaml<HelmChartYamlInterface> {
  constructor (value?: HelmChartYamlInterface) {
    super(value)
    if (!value) {
      this.value.cluster = {
        provider: 'local',
        cloudNativeServices: false,
      }
    }
  }

  public setProvider (provider: string, region: string = 'ap-southeast-2') {
    const clusterConfig = {
      provider: provider,
      cloudNativeServices: (provider !== 'local'),
    }
    this.setCluster(clusterConfig)

    const providers: { [key: string]: any } = {
      aws: {
        serviceAccountName: 'quorum-sa',
        region: region,
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

  protected setQuorumFlags (quorumFlags: quorumFlags) {
    this.value.quorumFlags = quorumFlags
  }

  protected setCluster (cluster: ClusterInterface) {
    this.value.cluster = cluster
  }

  protected setNode (node: NodeInterface) {
    this.value.node = node
  }

  protected setService (name: string, service: any) {
    this.value[name] = service
  }
}

export default HelmChartYaml
