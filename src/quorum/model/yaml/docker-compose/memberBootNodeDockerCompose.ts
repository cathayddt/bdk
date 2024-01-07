import DockerComposeYaml from './dockerComposeYaml'

class MemberDockerComposeYaml extends DockerComposeYaml {
  public addMember (bdkPath: string, memberNum: number, rpcPort: number, chainId: number, peerPort: number) {
    this.addNetwork('quorum', {})
    this.addService(`member${memberNum}`, {
      image: 'quorumengineering/quorum:23.4.0',
      // eslint-disable-next-line no-template-curly-in-string
      user: '${UID}:${GID}',
      container_name: `member${memberNum}`,
      restart: 'no',
      environment: ['PRIVATE_CONFIG=ignore'],
      ports: [
        `${rpcPort}:8545`,
        `${rpcPort + 1}:8546`,
        `${peerPort}:${peerPort}/tcp`,
        `${peerPort}:${peerPort}/udp`,
      ],
      networks: ['quorum'],
      volumes: [`${bdkPath}/member${memberNum}/data/:/data`],
      entrypoint: [
        '/bin/sh', '-c',
        `geth init --datadir /data /data/genesis.json; geth --datadir /data --networkid ${chainId} --bootnodes  --verbosity 3 --syncmode full --nousb  --http --http.addr 0.0.0.0 --http.port 8545 --http.corsdomain "*" --http.vhosts "*" --ws --ws.addr 0.0.0.0 --ws.port 8546 --ws.origins "*" --http.api admin,trace,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul,qbft --ws.api admin,trace,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul,qbft --port ${peerPort}`,
      ],
    })
  }
}

export default MemberDockerComposeYaml
