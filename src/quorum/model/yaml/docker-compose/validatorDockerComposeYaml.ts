import DockerComposeYaml from './dockerComposeYaml'

class ValidatorDockerComposeYaml extends DockerComposeYaml {
  public addValidator (bdkPath: string, validatorNum: number, rpcPort: number, chainId: number, peerPort: number) {
    this.addNetwork('quorum', {})
    this.addService(`validator${validatorNum}`, {
      image: 'quorumengineering/quorum:22.7.4',
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
      networks: ['quorum'],
      volumes: [`${bdkPath}/validator${validatorNum}/data/:/data`],
      entrypoint: [
        '/bin/sh', '-c',
        `geth init --datadir /data /data/genesis.json; geth --datadir /data --networkid ${chainId} --nodiscover --verbosity 3 --syncmode full --nousb --mine --miner.threads 1 --miner.gasprice 0 --emitcheckpoints --http --http.addr 0.0.0.0 --http.port 8545 --http.corsdomain "*" --http.vhosts "*" --ws --ws.addr 0.0.0.0 --ws.port 8546 --ws.origins "*" --http.api admin,trace,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul,qbft --ws.api admin,trace,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul,qbft --port ${peerPort} `,
      ],
    })
  }
}

export default ValidatorDockerComposeYaml
