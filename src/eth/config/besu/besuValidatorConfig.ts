import { NetworkConfigType, NetworkType } from '../network.type'

const besuConfig: NetworkConfigType = {
  image: 'hyperledger/besu:latest',
  networks: [NetworkType.BESU],
  entrypoint: (chainId, peerPort, bootnode, nodeEncode) => [
    '/bin/sh',
    '-c',
    `besu --sync-min-peers=2 --data-path=/data --node-private-key-file=/data/nodekey --genesis-file=/data/genesis.json --Xdns-enabled=true --network-id=${chainId} ${bootnode ? '--bootnodes '.concat(nodeEncode) : ''} --logging=INFO --graphql-http-enabled --sync-mode=FULL --rpc-http-enabled --rpc-http-port=8545 --host-whitelist="*" --rpc-http-api=EEA,WEB3,ETH,NET,TRACE,DEBUG,ADMIN,TXPOOL,QBFT --rpc-ws-enabled --rpc-ws-port=8546 --rpc-ws-api=EEA,WEB3,ETH,NET,TRACE,DEBUG,ADMIN,TXPOOL,QBFT --rpc-http-cors-origins="*" --rpc-http-host="0.0.0.0" --rpc-ws-host="0.0.0.0" --miner-enabled --miner-coinbase=0x0000000000000000000000000000000000000000 --min-gas-price=0 --p2p-port=${peerPort}`,
  ],
}

export default besuConfig
