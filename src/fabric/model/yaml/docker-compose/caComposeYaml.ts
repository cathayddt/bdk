import {
  CaBasicType,
  CaCryptoType,
  CaCsrType,
  CaIntermediateType,
  CaSigningType,
} from '../../type/caService.type'
import { Config } from '../../../config'
import DockerComposeYaml from './dockerComposeYaml'

class CaDockerComposeYaml extends DockerComposeYaml {
  public addCa (
    config: Config,
    basic: CaBasicType,
    crypto: CaCryptoType,
    signing: CaSigningType,
    upstreamEnabled?: boolean,
    csr?: CaCsrType,
    intermediate?: CaIntermediateType,
  ) {
    // TODO name can same as hosts name
    const caEnv: string[] = [
      `FABRIC_CA_SERVER_PORT=${basic.port}`,
      `FABRIC_CA_SERVER_CA_NAME=${basic.caName}`,
      `FABRIC_CA_SERVER_HOME=/fabric-ca/${basic.caName}/crypto`,
      'FABRIC_CA_SERVER_DEBUG=true',
      'FABRIC_CA_SERVER_TLS_ENABLED=true',
      // Signing options
      `FABRIC_CA_SERVER_SIGNING_DEFAULT_EXPIRY=${signing.defaultExpiry}`,
      `FABRIC_CA_SERVER_SIGNING_PROFILES_CA_EXPIRY=${signing.profilesCaExpiry}`,
      `FABRIC_CA_SERVER_SIGNING_PROFILES_TLS_EXPIRY=${signing.profilesTlsExpiry}`,
    ]
      .concat(
        crypto.caCertFile && crypto.caKeyFile
          ? [
              // Pregenerated CA Keypair
              `FABRIC_CA_SERVER_CA_CERTFILE=${crypto.caCertFile}`,
              `FABRIC_CA_SERVER_CA_KEYFILE=${crypto.caKeyFile}`,
          ]
          : [],
      )
      .concat(
        crypto.tlsCertFile && crypto.tlsKeyFile
          ? [
              // Pregenerated TLS Keypair
              `FABRIC_CA_SERVER_TLS_CERTFILE=${crypto.tlsCertFile}`,
              `FABRIC_CA_SERVER_TLS_KEYFILE=${crypto.tlsKeyFile}`,
          ]
          : [],
      )
      .concat(
        csr
          ? csr.cn && csr.hosts
            ? [
              // CSR (RCA) options
              `FABRIC_CA_SERVER_CSR_CN=${csr.cn}`,
              `FABRIC_CA_SERVER_CSR_HOSTS=${csr.hosts}`,
              `FABRIC_CA_SERVER_CSR_CA_EXPIRY=${csr.expiry}`,
              `FABRIC_CA_SERVER_CSR_CA_PATHLENGTH=${csr.pathlength}`,
            ]
            : [
              // CSR (ICA) options
              `FABRIC_CA_SERVER_CSR_HOSTS=${intermediate?.enrollmentHost}`,
              `FABRIC_CA_SERVER_CSR_CA_EXPIRY=${csr.expiry}`,
              `FABRIC_CA_SERVER_CSR_CA_PATHLENGTH=${csr.pathlength}`,
            ]
          : [],
      )
      .concat(
        upstreamEnabled && intermediate
          ? [
              // ICA options
              `FABRIC_CA_SERVER_INTERMEDIATE_PARENTSERVER_URL=${intermediate.parentserverUrl}`,
              `FABRIC_CA_SERVER_INTERMEDIATE_PARENTSERVER_CANAME=${intermediate.parentserverCn}`,
              `FABRIC_CA_SERVER_INTERMEDIATE_ENROLLMENT_HOSTS=${intermediate.enrollmentHost}`,
              'FABRIC_CA_SERVER_INTERMEDIATE_ENROLLMENT_PROFILE=ca',
              `FABRIC_CA_SERVER_INTERMEDIATE_TLS_CERTFILES=/fabric-ca/${intermediate.parentserverCn}/crypto/tls-cert.pem`,
          ]
          : [],
      )
    this.addService(basic.caName, {
      container_name: basic.caName,
      image: `hyperledger/fabric-ca:${config.fabricVersion.ca}`,
      environment: caEnv,
      command: `sh -c "fabric-ca-server start -b ${basic.adminUser}:${basic.adminPass}"`,
      networks: [config.networkName],
      ports: [`${basic.port}:${basic.port}`],
      volumes: [
        `\${BDK_DOCKER_HOST_PATH:-~/.bdk}/${config.networkName}/ca:/fabric-ca`,
      ],
      user: `${config.UID}:${config.GID}`,
    })
  }
}

export default CaDockerComposeYaml
