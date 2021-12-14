/**
 * @requires channels - channel 與 加入此 Channel 的 hostname
 */
export interface ExplorerUpForMyOrgType{
  channels?: {[channelName: string]: {hostname: string}} // {'my_channel': {hostname: 'peer0'}}
}
