import DockerComposeYaml from './dockerComposeYaml'

class ValidatorDockerComposeYaml extends DockerComposeYaml {
  public addValidator (bdkPath: string, validatorNum: number, port: number) {
    this.addNetwork('quorum', {})
    this.addService(`validator${validatorNum}`, {
      image: 'quorumengineering/quorum:22.7.4',
      container_name: `validator${validatorNum}`,
      restart: 'no',
      environment: ['PRIVATE_CONFIG=ignore'],
      ports: [
        `${port}:8545`,
      ],
      networks: ['quorum'],
      volumes: [`${bdkPath}/validator${validatorNum}/data/:/data`],
      entrypoint: [
        '/bin/sh', '-c',
        'geth init --datadir /data /data/genesis.json; geth --datadir /data --networkid 1337 --nodiscover --verbosity 3 --syncmode full --nousb --mine --miner.threads 1 --miner.gasprice 0 --emitcheckpoints --http --http.addr 0.0.0.0 --http.port 8545 --http.corsdomain "*" --http.vhosts "*" --ws --ws.addr 0.0.0.0 --ws.port 8546 --ws.origins "*" --http.api admin,trace,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul,qbft --ws.api admin,trace,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul,qbft --port 30303',
      ],
    })
  }
}

export default ValidatorDockerComposeYaml
