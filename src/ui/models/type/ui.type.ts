export interface ItemProps {
  label: string
  value: string
}

export interface CommandProps {
  type: string
}

export interface ContainerListProps {
  id: string
  names: string[]
  image: string
  status: string
  state: string
  created: number
  ports?: string[]
}

export interface NodeDetails {
  id: string
  name: string
  enode: string
  ip: string
}

export interface NodeGetPeers {
  network: {
    localAddress: string
    remoteAddress: string
  }
  id: string
  enode: string
}
