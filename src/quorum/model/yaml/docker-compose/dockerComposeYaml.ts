import BdkYaml from '../bdkYaml'

interface ServiceInterface {
  build?: {
    context?: string
    dockerfile?: string
    args?: { [key: string]: string }
  }
  command?: string
  container_name?: string
  hostname?: string
  depends_on?: {[serviceName: string]: {condition: string}}
  env_file?: string | string[]
  environment?: string[]
  image: string
  labels?: { [key: string]: string }
  networks?: string[]
  ports?: string[]
  volumes?: string[]
  working_dir?: string
  healthcheck?: {
    test: string
    interval: string
    timeout: string
    retries: number
  }
  user?: string
}

interface VolumeInterface {
  driver?: string
  driver_opts?: { [key: string]: string }
  external?: boolean
  labels?: { [key: string]: string }
  name?: string
}

interface NetworkInterface {
  driver?: 'bridge' | 'overlay'
  driver_opts?: { [key: string]: string }
  attachable?: boolean
  ipam?: {
    driver?: string
    config: { subnet: string }[]
  }
  internal?: boolean
  labels?: { [key: string]: string }
  external?: boolean
  name?: string
}

export interface DockerComposeYamlInterface {
  version: string
  services: {
    [serviceName: string]: ServiceInterface
  }
  volumes: {
    [volumeName: string]: VolumeInterface
  }
  networks: {
    [networkName: string]: NetworkInterface
  }
}

class DockerComposeYaml extends BdkYaml<DockerComposeYamlInterface> {
  constructor (value?: DockerComposeYamlInterface) {
    super(value || { version: '3.5', services: {}, volumes: {}, networks: {} })
  }

  public addService (serviceName: string, service: ServiceInterface) {
    this.value.services[serviceName] = service
  }

  public addVolume (volumeName: string, volume: VolumeInterface) {
    this.value.volumes[volumeName] = volume
  }

  public addNetwork (networkName: string, network: NetworkInterface) {
    this.value.networks[networkName] = network
  }

  public setServices (services: { [serviceName: string]: ServiceInterface }) {
    this.value.services = services
  }

  public setVolumes (volumes: { [volumeName: string]: VolumeInterface }) {
    this.value.volumes = volumes
  }

  public setNetworks (networks: { [networkName: string]: NetworkInterface }) {
    this.value.networks = networks
  }
}

export default DockerComposeYaml
