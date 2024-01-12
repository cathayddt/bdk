export interface K8SRunCommandType {
  helmChart: string
  name: string
  namespace: string
  values: string
  version?: string
  ignoreError?: boolean
}
