import DockerComposeYaml from './dockerComposeYaml'

class ValidatorDockerComposeYaml extends DockerComposeYaml {
  public addValidator (bdkPath: string, validatorNum: number, rpcPort: number, chainId: number, peerPort: number, bootnode: boolean, nodeEncode: string) {
    this.addNetwork('besu', {})
    this.addService(`validator${validatorNum}`, {
      image: 'hyperledger/besu:latest',
      // eslint-disable-next-line no-template-curly-in-string
      user: '${UID}:${GID}',
      container_name: `validator${validatorNum}`,
      restart: 'no',
      environment: ['PRIVATE_CONFIG=ignore'],
      ports: [
        `${rpcPort}:8545`,
        `${rpcPort + 1}:8546`,
        `${peerPort}:${peerPort}/tcp`,
        `${peerPort}:${peerPort}/udp`,
      ],
      networks: ['besu'],
      volumes: [`${bdkPath}/validator${validatorNum}/data/:/data`],
      entrypoint: [
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
        --rpc-http-api=ADMIN,CLIQUE,DEBUG,EEA,ETH,IBFT,MINER,NET,PERM,PLUGINS,PRIV,QBFT,TRACE,TXPOOL,WEB3 \
        --rpc-ws-enabled \
        --rpc-ws-port=8546 \
        --rpc-ws-api=ADMIN,CLIQUE,DEBUG,EEA,ETH,IBFT,MINER,NET,PERM,PLUGINS,PRIV,QBFT,TRACE,TXPOOL,WEB3 \
        --rpc-http-cors-origins="*" \
        --rpc-http-host="0.0.0.0" \
        --rpc-ws-host="0.0.0.0" \
        --miner-enabled\
        --miner-coinbase=0x0000000000000000000000000000000000000000 \
        --min-gas-price=0 \
        --p2p-port=${peerPort} `,
      ],
    })
  }
}

export default ValidatorDockerComposeYaml
