export interface NodeDetails {
  id: string
  name: string
  enode: string
  ip: string
}

export interface PeerInformation {
  id: string
  enode: string
  name: string
  network: {
    localAddress: string
    remoteAddress: string
  }
}

export interface NodeListType {
  value: string
  label: string
}
