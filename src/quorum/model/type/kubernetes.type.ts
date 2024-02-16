import { NetworkCreateType } from './network.type'
export interface K8SRunCommandType {
  helmChart: string
  name: string
  namespace: string
  values: string
  version?: string
  ignoreError?: boolean
}

export interface ClusterCreateType extends NetworkCreateType {
  provider: string
  region?: string
}

/**
 * @requires chartPackageModeEnabled - package without helm and k8s
 */
export interface ClusterGenerateType {
  chartPackageModeEnabled: boolean
}
