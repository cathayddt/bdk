import { AbstractService } from './Service.abstract'
import KubernetesInstance from '../instance/kubernetesCluster'
import { NetworkCreateType } from '../model/type/network.type'
import { ClusterGenerateType } from '../model/type/kubernetes.type'
import { GenesisConfigYaml, ValidatorConfigYaml, MemberConfigYaml } from '../model/yaml/helm-chart'
export default class Cluster extends AbstractService {
  /**
   * @description Use helm create quorum template
   */
  public async apply (networkCreateConfig: NetworkCreateType): Promise<void> {
    const { chainId, validatorNumber, memberNumber, alloc } = networkCreateConfig
    // create genesis and account
    const k8s = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
    const genesisYaml = new GenesisConfigYaml()
    genesisYaml.setCluster()
    genesisYaml.setGenesis(chainId, validatorNumber, alloc)

    this.bdkFile.createGenesisChartValues(genesisYaml)
    // custom namespace
    await k8s.install({
      helmChart: this.bdkFile.getGoQuorumGensisChartPath(),
      name: 'genesis',
      namespace: 'quorum',
      values: this.bdkFile.getGenesisChartPath(),
    })

    await k8s.wait('job.batch/goquorum-genesis-init', 'quorum')
    // create network
    const validatorYaml = new ValidatorConfigYaml()
    validatorYaml.setCluster()
    validatorYaml.setQuorumFlags()
    validatorYaml.setNode()

    for (let i = 0; i < validatorNumber; i += 1) {
      this.bdkFile.createValidatorChartValues(validatorYaml, i)
    }

    const memberYaml = new MemberConfigYaml()
    memberYaml.setCluster()
    memberYaml.setQuorumFlags()
    memberYaml.setNode()
    for (let i = 0; i < memberNumber; i += 1) {
      this.bdkFile.createMemberChartValues(memberYaml, i)
    }
    for (let i = 0; i < validatorNumber; i += 1) {
      await k8s.install({
        helmChart: this.bdkFile.getGoQuorumNodeChartPath(),
        name: `validator-${i + 1}`,
        namespace: 'quorum',
        values: this.bdkFile.getValidatorChartPath(i),
      })
    }
    for (let i = 0; i < memberNumber; i += 1) {
      await k8s.install({
        helmChart: this.bdkFile.getGoQuorumNodeChartPath(),
        name: `member-${i + 1}`,
        namespace: 'quorum',
        values: this.bdkFile.getMemberChartPath(i),
      })
    }
  }

  /**
   * @description Use helm create quorum template
   */
  public async generate (
    clusterGenerateConfig: ClusterGenerateType,
    networkCreateConfig: NetworkCreateType,
  ): Promise<void> {
    const { chainId, validatorNumber, memberNumber, alloc } = networkCreateConfig
    // create genesis and account
    const genesisYaml = new GenesisConfigYaml()
    genesisYaml.setCluster()
    genesisYaml.setGenesis(chainId, validatorNumber, alloc)

    this.bdkFile.createGenesisChartValues(genesisYaml)

    const validatorYaml = new ValidatorConfigYaml()
    validatorYaml.setCluster()
    validatorYaml.setQuorumFlags()
    validatorYaml.setNode()

    for (let i = 0; i < validatorNumber; i += 1) {
      this.bdkFile.createValidatorChartValues(validatorYaml, i)
    }

    const memberYaml = new MemberConfigYaml()
    memberYaml.setCluster()
    memberYaml.setQuorumFlags()
    memberYaml.setNode()
    for (let i = 0; i < memberNumber; i += 1) {
      this.bdkFile.createMemberChartValues(memberYaml, i)
    }

    if (clusterGenerateConfig.chartPackageModeEnabled) {
      const k8s = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
      await k8s.template({
        helmChart: this.bdkFile.getGoQuorumGensisChartPath(),
        name: 'genesis',
        namespace: 'quorum',
        values: this.bdkFile.getGenesisChartPath(),
      })
    }
  }
}
