import { Config } from '../../../config'
import DockerComposeYaml from './dockerComposeYaml'

class ExplorerDockerComposeYaml extends DockerComposeYaml {
  constructor (config: Config, port: number = 8080) {
    super()
    this.addNetwork(config.networkName, { name: config.networkName, external: true })
    this.addVolume(`explorerdb.${config.networkName}`, {})
    this.addService(
      `explorerdb.${config.networkName}`,
      {
        image: `hyperledger/explorer-db:${config.fabricVersion.explorerDb}`,
        container_name: `explorerdb.${config.networkName}`,
        hostname: `explorerdb.${config.networkName}`,
        environment: [
          'DATABASE_DATABASE=fabricexplorer',
          'DATABASE_USERNAME=hppoc',
          'DATABASE_PASSWORD=password',
        ],
        healthcheck: {
          test: 'pg_isready -h localhost -p 5432 -q -U postgres',
          interval: '30s',
          timeout: '10s',
          retries: 5,
        },
        volumes: [
          `explorerdb.${config.networkName}:/var/lib/postgresql/data`,
        ],
        networks: [
          config.networkName,
        ],
      },
    )
    this.addService(
      `explorer.${config.networkName}`,
      {
        image: `hyperledger/explorer:${config.fabricVersion.explorer}`,
        container_name: `explorer.${config.networkName}`,
        hostname: `explorer.${config.networkName}`,
        environment: [
          `DATABASE_HOST=explorerdb.${config.networkName}`,
          'DATABASE_DATABASE=fabricexplorer',
          'DATABASE_USERNAME=hppoc',
          'DATABASE_PASSWD=password',
          'LOG_LEVEL_APP=debug',
          'LOG_LEVEL_DB=debug',
          'LOG_LEVEL_CONSOLE=info',
          'LOG_CONSOLE_STDOUT=true',
          'DISCOVERY_AS_LOCALHOST=false',
        ],
        volumes: [
          `\${BDK_DOCKER_HOST_PATH:-~/.bdk}/${config.networkName}/fabric-explorer/config.json:/opt/explorer/app/platform/fabric/config.json`,
          `\${BDK_DOCKER_HOST_PATH:-~/.bdk}/${config.networkName}/fabric-explorer/connection-profile:/opt/explorer/app/platform/fabric/connection-profile`,
        ],
        ports: [
          `${port}:8080`,
        ],
        depends_on: {
          [`explorerdb.${config.networkName}`]: {
            condition: 'service_healthy',
          },
        },
        networks: [
          config.networkName,
        ],
      },
    )
  }
}

export default ExplorerDockerComposeYaml
