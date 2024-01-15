export interface K8SRunCommandType {
  helmChart: string
  name: string
  namespace: string
  values: string
  version?: string
  ignoreError?: boolean
}

/**
 * @requires chartPackageModeEnabled - package without helm and k8s
 */
export interface ClusterGenerateType {
  chartPackageModeEnabled: boolean
}
