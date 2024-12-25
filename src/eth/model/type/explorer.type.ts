export interface ExplorerChannelType {
  [channelName: string]: {hostname: string}
}

/**
 * @requires bdkPath - explorer 的 bdk 路徑
 * @requires httpModeEnabled - 是否啟用 http 模式
 * @requires nodeName - explorer 使用的節點名稱
 * @requires port - explorer 的 port
 */
export interface ExplorerCreateType {
  httpModeEnabled: boolean
  nodeName: string
  port: number
  networkType: string
}

/**
 * @requires user - explorer 的預設使用者
 * @requires pass - explorer 的預設密碼
 * @requires port - explorer 的 port
 */
export interface ExplorerUpForMyOrgType {
  user: string
  pass: string
  port: number
}

/**
 * @ignore
 */
export interface ExplorerUpForMyOrgStepUpType extends ExplorerUpForMyOrgType {
  channels: ExplorerChannelType // {'my_channel': {hostname: 'peer0'}}
}

/**
 * @ignore
 */
export interface ExplorerUpdateForMyOrgStepRestartType {
  channels: ExplorerChannelType // {'my_channel': {hostname: 'peer0'}}
}
