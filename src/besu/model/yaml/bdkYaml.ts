import YAML from 'js-yaml'

class BdkYaml<T> {
  public value: T

  constructor (value?: T) {
    this.value = value || {} as T
  }

  public getYamlString () {
    return YAML.dump(this.value, { forceQuotes: true })
  }

  public getJsonString () {
    return JSON.stringify(this.value)
  }

  // public replacement = {}
}

export default BdkYaml
