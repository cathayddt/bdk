export interface ExplorerChannelType {
  [channelName: string]: {hostname: string}
}

/**
 * @requires channels - channel 與 加入此 Channel 的 hostname
 */
export interface ExplorerUpForMyOrgType extends ExplorerUpdateForMyOrgType{
  user: string
  pass: string
  port: number
}

/**
 * @requires channels - channel 與 加入此 Channel 的 hostname
 */
export interface ExplorerUpdateForMyOrgType {
  channels?: ExplorerChannelType // {'my_channel': {hostname: 'peer0'}}
}
