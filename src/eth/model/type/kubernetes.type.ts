import { NetworkCreateType } from './network.type'
import { NetworkType } from '../../config/network.type'

export interface K8SRunCommandType {
  helmChart: string
  name: string
  namespace: string
  values: string
  version?: string
  ignoreError?: boolean 
}

export interface ClusterDeleteType {
  name: string
  namespace: string
}
export interface ClusterCreateType extends NetworkCreateType {
  provider: string
  region?: string
  networkType: NetworkType
}

/**
 * @requires chartPackageModeEnabled - package without helm and k8s
 */
export interface ClusterGenerateType {
  chartPackageModeEnabled: boolean
}
