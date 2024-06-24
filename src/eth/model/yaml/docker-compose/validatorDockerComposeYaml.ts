import DockerComposeYaml from './dockerComposeYaml'
import { getNetworkConfig } from '../../../config/networkConfigLoader'
import { NetworkType } from '../../../config/network.type'
import { NodeTypeEnum } from '../../type/config.type'

class ValidatorDockerComposeYaml extends DockerComposeYaml {
  public addValidator (
    bdkPath: string,
    validatorNum: number,
    rpcPort: number,
    chainId: number,
    peerPort: number,
    bootnode: boolean,
    nodeEncode: string,
    networkType: NetworkType,
  ) {
    const config = getNetworkConfig(networkType, NodeTypeEnum.VALIDATOR)
    if (!config) {
      throw new Error(`Unsupported network type: ${networkType}`)
    }

    this.addNetwork(networkType, {})
    this.addService(`validator${validatorNum}`, {
      image: config.image,
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
      networks: config.networks,
      volumes: [`${bdkPath}/validator${validatorNum}/data/:/data`],
      entrypoint: config.entrypoint(chainId, peerPort, bootnode, nodeEncode),
    })
  }
}

export default ValidatorDockerComposeYaml
