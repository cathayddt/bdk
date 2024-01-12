import { AbstractService } from './Service.abstract'
import KubernetesInstance from '../instance/kubernetesCluster'
import { GenesisConfigYaml, ValidatorConfigYaml, MemberConfigYaml } from '../model/yaml/helm-chart'
export default class Cluster extends AbstractService {
  /**
   * @description Use helm create quorum template
   */
  public async create (): Promise<void> {
    const validatorNum = 4
    const memberNum = 4
    // create genesis and account
    const k8s = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
    const genesisYaml = new GenesisConfigYaml()
    // TODO: add setting and config
    genesisYaml.setCluster()
    genesisYaml.setGenesis(validatorNum)

    this.bdkFile.createGenesisChartValues(genesisYaml)
    // custom namespace
    await k8s.install({
      helmChart: this.bdkFile.getGoQuorumGensisChartPath(),
      name: 'genesis',
      namespace: 'quorum',
      values: this.bdkFile.getGenesisChartPath(),
    })

    // create network
    const validatorYaml = new ValidatorConfigYaml()
    validatorYaml.setCluster()
    validatorYaml.setQuorumFlags()
    validatorYaml.setNode()

    for (let i = 0; i < validatorNum; i += 1) {
      this.bdkFile.createValidatorChartValues(validatorYaml, i)
    }

    const memberYaml = new MemberConfigYaml()
    memberYaml.setCluster()
    memberYaml.setQuorumFlags()
    memberYaml.setNode()
    for (let i = 0; i < memberNum; i += 1) {
      this.bdkFile.createMemberChartValues(memberYaml, i)
    }
    for (let i = 0; i < validatorNum; i += 1) {
      await k8s.install({
        helmChart: this.bdkFile.getGoQuorumNodeChartPath(),
        name: 'validator',
        namespace: 'quorum',
        values: this.bdkFile.getValidatorChartPath(i),
      })
    }
    for (let i = 0; i < memberNum; i += 1) {
      await k8s.install({
        helmChart: this.bdkFile.getGoQuorumNodeChartPath(),
        name: 'member',
        namespace: 'quorum',
        values: this.bdkFile.getMemberChartPath(i),
      })
    }
  }
}
