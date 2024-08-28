import { NetworkConfigType, NetworkType } from '../network.type'

const besuConfig: NetworkConfigType = {
  image: 'hyperledger/besu:latest',
  networks: [NetworkType.BESU],
  entrypoint: (chainId, peerPort, bootnode, nodeEncode) => [
    '/bin/sh', '-c',
    `besu --data-path=/data \
        --genesis-file=/data/genesis.json \
        --network-id=${chainId} \
        ${(bootnode) ? '--bootnodes '.concat(nodeEncode) : ''}\
        --logging=INFO \
        --sync-mode=FULL \
        --rpc-http-enabled \
        --rpc-http-port=8545 \
        --host-whitelist="*" \
        --rpc-http-api=ADMIN,DEBUG,EEA,ETH,MINER,NET,PERM,PLUGINS,PRIV,QBFT,TRACE,TXPOOL,WEB3 \
        --rpc-ws-enabled \
        --rpc-ws-port=8546 \
        --rpc-ws-api=ADMIN,DEBUG,EEA,ETH,MINER,NET,PERM,PLUGINS,PRIV,QBFT,TRACE,TXPOOL,WEB3 \
        --rpc-http-cors-origins="*" \
        --rpc-http-host="0.0.0.0" \
        --rpc-ws-host="0.0.0.0" \
        --Xdns-enabled=true \
        --p2p-port=${peerPort}`,
  ],
}

export default besuConfig
