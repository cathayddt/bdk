import YAML from 'yaml'

class BdkYaml<T> {
  public value: T

  constructor (value?: T) {
    this.value = value || {} as T
  }

  public getYamlString () {
    return YAML.stringify(this.value)
  }

  public getJsonString () {
    return JSON.stringify(this.value)
  }

  // public replacement = {}
}

export default BdkYaml
