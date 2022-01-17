export interface ExplorerChannelType {
  [channelName: string]: {hostname: string}
}

/**
 * @requires user - explorer 的預設使用者
 * @requires pass - explorer 的預設密碼
 * @requires port - explorer 的 port
 */
export interface ExplorerUpForMyOrgType{
  user: string
  pass: string
  port: number
}

/**
 * @ignore
 */
export interface ExplorerUpForMyOrgStepUpType extends ExplorerUpForMyOrgType{
  channels: ExplorerChannelType // {'my_channel': {hostname: 'peer0'}}
}

/**
 * @ignore
 */
export interface ExplorerUpdateForMyOrgStepRestartType {
  channels: ExplorerChannelType // {'my_channel': {hostname: 'peer0'}}
}
