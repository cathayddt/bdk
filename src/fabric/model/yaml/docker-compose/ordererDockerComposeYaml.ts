import { Config } from '../../../config'
import DockerComposeYaml from './dockerComposeYaml'

class OrdererDockerComposeYaml extends DockerComposeYaml {
  public addOrderer (config: Config, name: string, domain: string, hostname: string, genesisFileName: string, port: number = 7050, operationPort: number = 8443, isPublishPort: boolean = true, isPublishOperationPort: boolean = true) {
    const containerName = `${hostname}.${domain}`
    this.addVolume(containerName, {})
    this.addService(containerName, {
      container_name: containerName,
      image: `hyperledger/fabric-orderer:${config.fabricVersion.orderer}`,
      environment: [
        'FABRIC_LOGGING_SPEC=INFO',
        'ORDERER_GENERAL_LISTENADDRESS=0.0.0.0',
        `ORDERER_GENERAL_LISTENPORT=${port}`,
        'ORDERER_GENERAL_GENESISMETHOD=file',
        'ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block',
        `ORDERER_GENERAL_LOCALMSPID=${name}`,
        'ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp',
        // enabled operations service
        `ORDERER_OPERATIONS_LISTENADDRESS=0.0.0.0:${operationPort}`,
        'ORDERER_OPERATIONS_TLS_ENABLED=true',
        'ORDERER_OPERATIONS_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt',
        'ORDERER_OPERATIONS_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key',
        // enabled TLS
        'ORDERER_GENERAL_TLS_ENABLED=true',
        'ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key',
        'ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt',
        'ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]',
        'ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/var/hyperledger/orderer/tls/server.crt',
        'ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/var/hyperledger/orderer/tls/server.key',
        'ORDERER_GENERAL_CLUSTER_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]',
      ],
      working_dir: '/opt/gopath/src/github.com/hyperledger/fabric',
      command: 'orderer',
      volumes: [
        `\${BDK_DOCKER_HOST_PATH:-~/.bdk}/${config.networkName}/channel-artifacts/system-channel/${genesisFileName}.block:/var/hyperledger/orderer/orderer.genesis.block`,
        `\${BDK_DOCKER_HOST_PATH:-~/.bdk}/${config.networkName}/ordererOrganizations/${domain}/orderers/${hostname}.${domain}/msp:/var/hyperledger/orderer/msp`,
        `\${BDK_DOCKER_HOST_PATH:-~/.bdk}/${config.networkName}/ordererOrganizations/${domain}/orderers/${hostname}.${domain}/tls:/var/hyperledger/orderer/tls`,
        `${containerName}:/var/hyperledger/production/orderer`,
      ],
      networks: [config.networkName],
      ports: ((isPublishPort ? [port] : []).concat(isPublishOperationPort ? [operationPort] : [])).filter(x => x !== 0).map(x => `${x}:${x}`),
    })
  }

  public getOrdererOrgEnv (config: Config, name: string, hostname: string, domain: string, port: number = 7054): string {
    return [
      `CORE_PEER_MSPCONFIGPATH=${config.infraConfig.dockerPath}/ordererOrganizations/${domain}/users/Admin@${domain}/msp`,
      `CORE_PEER_ADDRESS=${hostname}.${domain}:${port}`,
      `CORE_PEER_LOCALMSPID=${name}`,
      `CORE_PEER_TLS_ROOTCERT_FILE=${config.infraConfig.dockerPath}/tlsca/${hostname}.${domain}/ca.crt`,
      `ORDERER_CA=${config.infraConfig.dockerPath}/tlsca/${hostname}.${domain}/ca.crt`,
    ].join('\n')
  }
}

export default OrdererDockerComposeYaml
