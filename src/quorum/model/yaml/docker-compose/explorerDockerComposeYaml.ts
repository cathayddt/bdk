import DockerComposeYaml from './dockerComposeYaml'

class ExplorerDockerComposeYaml extends DockerComposeYaml {
  constructor (bdkPath: string, port: number = 26000) {
    super()
    this.addNetwork('quorum', {})
    this.addVolume('blockscoutpostgres', {})
    this.addService(
      'blockscout',
      {
        image: 'consensys/blockscout:v4.1.5-beta',
        restart: 'no',
        container_name: 'blockscout',
        environment: [
          'PORT=4000',
          'ECTO_USE_SSL=false',
          'DATABASE_URL=postgresql://postgres:postgres@blockscoutpostgres:5432/postgres?ssl=false',
          'POSTGRES_PASSWORD=postgres',
          'POSTGRES_USER=postgres',
          'NETWORK=quickstart',
          'NETWORK=Dev Quickstart',
          'SUBNETWORK=Quorum',
          'COIN=""',
          'SHOW_PRICE_CHART=false',
          'ETHEREUM_JSONRPC_VARIANT=geth',
          'ETHEREUM_JSONRPC_TRANSPORT=ipc',
          'IPC_PATH=/root/geth.ipc',
        ],
        entrypoint: ['/bin/sh', '-c', 'cd /opt/app/; echo $$MIX_ENV && mix do ecto.create, ecto.migrate; mix phx.server;'],
        depends_on: {
          blockscoutpostgres: {
            condition: 'service_healthy',
          },
        },
        links: ['blockscoutpostgres'],
        ports: [
          `${port}:4000`,
        ],
        networks: ['quorum'],
        volumes: [`${bdkPath}/validator0/data/geth.ipc:/root/geth.ipc`],
      },
    )
    this.addService(
      'blockscoutpostgres',
      {
        image: 'postgres:13.6-alpine',
        container_name: 'blockscoutpostgres',
        environment: [
          'POSTGRES_USER=postgres',
          'POSTGRES_PASSWORD=postgres',
          'POSTGRES_HOST_AUTH_METHOD=trust',
        ],
        volumes: [
          'blockscoutpostgres:/var/lib/postgresql/data',
        ],
        ports: [
          '5432',
        ],
        healthcheck: {
          test: 'pg_isready -U postgres',
          interval: '5s',
          timeout: '10s',
          retries: 5,
        },
        networks: ['quorum'],
      },
    )
  }
}

export default ExplorerDockerComposeYaml
