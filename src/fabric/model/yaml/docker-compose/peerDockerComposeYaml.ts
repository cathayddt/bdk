import { Config } from '../../../config'
import DockerComposeYaml from './dockerComposeYaml'

class PeerDockerComposeYaml extends DockerComposeYaml {
  public addPeer (config: Config, name: string, domain: string, number: number, bootstrapPeerNumber: number, bootstrapPeerPort: number = 7051, port: number = 7051, operationPort: number = 9443, isPublishPort: boolean = true, isPublishOperationPort: boolean = true) {
    const containerName = `peer${number}.${domain}`

    this.addVolume(containerName, {})
    this.addService(containerName, {
      container_name: containerName,
      image: `hyperledger/fabric-peer:${config.fabricVersion.peer}`,
      environment: [
        // Generic peer variables
        'CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock',
        // the following setting starts chaincode containers on the same
        // bridge network as the peers
        // https://docs.docker.com/compose/networking/
        `CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=${config.networkName}`,
        'FABRIC_LOGGING_SPEC=INFO',
        'CORE_PEER_TLS_ENABLED=true',
        'CORE_PEER_PROFILE_ENABLED=true',
        'CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp',
        'CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt',
        'CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key',
        'CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt',
        // Peer specific variabes
        `CORE_PEER_ID=peer${number}.${domain}`,
        `CORE_PEER_ADDRESS=peer${number}.${domain}:${port}`,
        `CORE_PEER_LISTENADDRESS=0.0.0.0:${port}`,
        `CORE_PEER_CHAINCODEADDRESS=peer${number}.${domain}:7052`,
        'CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052',
        `CORE_PEER_GOSSIP_BOOTSTRAP=peer${bootstrapPeerNumber}.${domain}:${bootstrapPeerPort}`,
        `CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer${number}.${domain}:${port}`,
        `CORE_PEER_LOCALMSPID=${name}`,
        // enabled operations service
        `CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:${operationPort}`,
        'CORE_OPERATIONS_TLS_ENABLED=true',
        'CORE_OPERATIONS_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt',
        'CORE_OPERATIONS_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key',
        // leader peer variables
        'CORE_PEER_GOSSIP_USELEADERELECTION=true',
        'CORE_PEER_GOSSIP_ORGLEADER=false',
      ],
      working_dir: '/opt/gopath/src/github.com/hyperledger/fabric/peer',
      command: 'peer node start',
      volumes: [
        '/var/run/:/host/var/run/',
        `\${BDK_DOCKER_HOST_PATH:-~/.bdk}/${config.networkName}/peerOrganizations/${domain}/peers/peer${number}.${domain}/msp:/etc/hyperledger/fabric/msp`,
        `\${BDK_DOCKER_HOST_PATH:-~/.bdk}/${config.networkName}/peerOrganizations/${domain}/peers/peer${number}.${domain}/tls:/etc/hyperledger/fabric/tls`,
        `${containerName}:/var/hyperledger/production`,
      ],
      networks: [config.networkName],
      ports: ((isPublishPort ? [port] : []).concat(isPublishOperationPort ? [operationPort] : [])).filter(x => x !== 0).map(x => `${x}:${x}`),
    })
  }

  public getPeerOrgEnv (config: Config, name: string, peerIndex: number, domain: string, port: number = 7051): string {
    return [
      'FABRIC_CFG_PATH=/etc/hyperledger/fabric',
      'CORE_PEER_TLS_ENABLED=true',
      `CORE_PEER_LOCALMSPID=${name}`,
      `CORE_PEER_TLS_ROOTCERT_FILE=${config.infraConfig.dockerPath}/peerOrganizations/${domain}/peers/peer${peerIndex}.${domain}/tls/ca.crt`,
      `CORE_PEER_MSPCONFIGPATH=${config.infraConfig.dockerPath}/peerOrganizations/${domain}/users/Admin@${domain}/msp`,
      `CORE_PEER_ADDRESS=peer${peerIndex}.${domain}:${port}`,
    ].join('\n')
  }
}

export default PeerDockerComposeYaml
