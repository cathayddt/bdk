import BdkYaml from '../bdkYaml'

interface NetworkConfig {
  name: string
  profile: string
}

interface ExplorerConfigInterface {
  'network-configs': {
    [configName: string]: NetworkConfig
  }
  license: string
}

class ExplorerConfigYaml extends BdkYaml<ExplorerConfigInterface> {
  constructor (value?: ExplorerConfigInterface) {
    super(value)
    if (!value) {
      this.value.license = 'Apache-2.0'
      this.value['network-configs'] = {}
    }
  }

  /**
   *
   * @param name - test-network
   */

  public addNetwork (name: string) {
    this.value['network-configs'][name] = {
      name: name,
      profile: `./connection-profile/${name}.json`,
    }
  }

  public getNetworkList (): string[] {
    return Object.keys(this.value['network-configs'])
  }
}

export default ExplorerConfigYaml
