import DockerComposeYaml from './dockerComposeYaml'
import { getNetworkConfig } from '../../../config/networkConfigLoader'
import { NetworkType } from '../../../config/network.type'
import { NodeTypeEnum } from '../../type/config.type'
class MemberDockerComposeYaml extends DockerComposeYaml {
  public addMember (
    bdkPath: string,
    memberNum: number,
    rpcPort: number,
    chainId: number,
    peerPort: number,
    bootnode: boolean,
    nodeEncode: string,
    networkType: NetworkType,
  ) {
    const config = getNetworkConfig(networkType, NodeTypeEnum.MEMBER)
    if (!config) {
      throw new Error(`Unsupported network type: ${networkType}`)
    }

    this.addNetwork(networkType, {})
    this.addService(`member${memberNum}`, {
      image: config.image,
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
      networks: config.networks,
      volumes: [`${bdkPath}/member${memberNum}/data/:/data`],
      entrypoint: config.entrypoint(chainId, peerPort, bootnode, nodeEncode),
    })
  }
}

export default MemberDockerComposeYaml
