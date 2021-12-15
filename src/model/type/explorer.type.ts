export interface ExplorerChannelType {
  [channelName: string]: {hostname: string}
}

/**
 * @requires channels - channel 與 加入此 Channel 的 hostname
 */
export interface ExplorerUpForMyOrgType{
  user: string
  pass: string
  port: number
  channels?: ExplorerChannelType // {'my_channel': {hostname: 'peer0'}}
}

/**
 * @requires channels - channel 與 加入此 Channel 的 hostname
 */
export interface ExplorerUpdateForMyOrgType {
  channels?: ExplorerChannelType // {'my_channel': {hostname: 'peer0'}}
}
