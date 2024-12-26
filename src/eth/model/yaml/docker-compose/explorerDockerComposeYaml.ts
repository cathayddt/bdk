import DockerComposeYaml from './dockerComposeYaml'

class ExplorerDockerComposeYaml extends DockerComposeYaml {
  constructor (
    bdkPath: string,
    httpModeEnabled: boolean = false,
    nodeName: string,
    port: number = 26000,
    network: string,
  ) {
    super()
    this.addNetwork(network, {})
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
          `SUBNETWORK=${network}`,
          'COIN=""',
          'SHOW_PRICE_CHART=false',
          'ETHEREUM_JSONRPC_VARIANT=geth',
          'DISABLE_EXCHANGE_RATES=true',
          'INDEXER_DISABLE_INTERNAL_TRANSACTIONS_FETCHER=true',
        ]
          .concat(
            httpModeEnabled ? [
              'ETHEREUM_JSONRPC_TRANSPORT=http',
              `ETHEREUM_JSONRPC_HTTP_URL=http://${nodeName}:8545`,
              `ETHEREUM_JSONRPC_TRACE_URL=http://${nodeName}:8545`,
              `ETHEREUM_JSONRPC_WS_URL=ws://${nodeName}:8546`,
            ] : [
              'ETHEREUM_JSONRPC_TRANSPORT=ipc',
              'IPC_PATH=/root/geth.ipc',
            ],
          ),
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
        networks: [network],
        volumes: (httpModeEnabled) ? [] : [`${bdkPath}/${nodeName}/data/geth.ipc:/root/geth.ipc`],
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
        networks: [network],
      },
    )
  }
}

export default ExplorerDockerComposeYaml
