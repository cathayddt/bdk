import { AbstractService } from './Service.abstract'
import KubernetesInstance from '../instance/kubernetesCluster'
import GenesisYaml from '../model/yaml/helm-chart/genesisYaml'
export default class Cluster extends AbstractService {
  /**
   * @description Use helm create quorum template
   */
  public async create (): Promise<void> {
    await console.log('create')
    // create genesis first
    const k8 = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
    const genesisYaml = new GenesisYaml()
    genesisYaml.setCluster()
    genesisYaml.setGenesis()
    console.log(genesisYaml.getYamlString())
    this.bdkFile.createGenesisChartValues(genesisYaml)
    // custom namespace
    await k8.install({
      helmChart: this.bdkFile.getGoQuorumGensisChartPath(),
      name: 'genesis',
      namespace: 'quorum',
      values: this.bdkFile.getGenesisChartPath(),
    })
  }
}
