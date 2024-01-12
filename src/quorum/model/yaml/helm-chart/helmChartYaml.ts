import { string } from 'yargs'
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
      serviceMonitor: boolean
    }
    resources: {
      cpuLimit: number
      cpuRequest: string
      memLimit: string
      memRequest: string
    }
    account: {
      password: string
    }
  }
  tessera: {
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

  public setQuorumFlags (quorumFlags: quorumFlags) {
    this.value.quorumFlags = quorumFlags
  }

  public setCluster (cluster: ClusterInterface) {
    this.value.cluster = cluster
  }

  public setAws (aws: AwsInterface) {
    this.value.aws = aws
    if (this.value.cluster) {
      this.value.cluster.provider = 'aws'
    }
  }

  public setAzure (azure: AzureInterface) {
    this.value.azure = azure
    if (this.value.cluster) {
      this.value.cluster.provider = 'azure'
    }
  }

  public setNode (node: NodeInterface) {
    this.value.node = node
  }

  public setService (name: string, service: any) {
    this.value[name] = service
  }
}

export default HelmChartYaml
