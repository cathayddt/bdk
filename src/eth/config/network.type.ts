export enum NetworkType {
  BESU = 'besu',
  QUORUM = 'quorum',
}

export interface NetworkConfigType {
  image: string
  networks: NetworkType[]
  entrypoint: (
    chainId: number,
    peerPort: number,
    bootnode: boolean,
    nodeEncode: string
  ) => string[]
}

export const getNetworkTypeChoices = () => {
  return Object.values(NetworkType).map(value => ({
    title: value.charAt(0).toUpperCase() + value.slice(1),
    value: value,
  }))
}
