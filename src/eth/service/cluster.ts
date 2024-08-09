import tar from 'tar'
import { Ora } from 'ora'
import { tarDateFormat } from '../../util'
import { AbstractService } from './Service.abstract'
import KubernetesInstance from '../instance/kubernetesCluster'
import { ClusterCreateType, ClusterGenerateType } from '../model/type/kubernetes.type'
import { DockerResultType } from '../instance/infra/InfraRunner.interface'
import { getClusterConfig } from '../config/networkConfigLoader'
import { NetworkType } from '../config/network.type'

export default class Cluster extends AbstractService {
  /**
   * @description Use helm create quorum template
   */
  public async apply (networkCreateConfig: ClusterCreateType, spinner: Ora): Promise<void> {
    const { provider, region, chainId, validatorNumber, memberNumber, networkType } = networkCreateConfig
    const clusterConfig = getClusterConfig(networkType)
    // create genesis and account
    this.bdkFile.checkHelmChartPath()
    const genesisYaml = new clusterConfig.genesisConfig()
    genesisYaml.setProvider(provider, region)
    genesisYaml.setGenesis(chainId, validatorNumber,networkType)

    this.bdkFile.createGenesisChartValues(genesisYaml)
    // custom namespace
    spinner.start('Helm install genesis chart')
    const k8s = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
    const genesisOutput = await k8s.install({
      helmChart: this.bdkFile.getGenesisChartPath(),
      name: 'genesis',
      namespace: clusterConfig.namespace,
      values: this.bdkFile.getGenesisChartValuesPath(),
    }) as DockerResultType
    const namespaceForJob = clusterConfig.namespace === 'quorum' ? 'goquorum' : clusterConfig.namespace;
    await k8s.wait(`job.batch/${namespaceForJob}-genesis-init`, clusterConfig.namespace)

    spinner.succeed(`Helm install genesis chart ${genesisOutput.stdout}`)
    // create network
    const validatorYaml = new clusterConfig.validatorConfig()
    validatorYaml.setProvider(provider, region)
    validatorYaml.setQuorumConfigs()

    for (let i = 0; i < validatorNumber; i += 1) {
      this.bdkFile.createValidatorChartValues(validatorYaml, i)
    }

    const memberYaml = new clusterConfig.memberConfig()
    memberYaml.setProvider(provider, region)
    memberYaml.setQuorumConfigs()
    for (let i = 0; i < memberNumber; i += 1) {
      this.bdkFile.createMemberChartValues(memberYaml, i)
    }
    for (let i = 0; i < validatorNumber; i += 1) {
      spinner.start(`Helm install validator chart ${i + 1}`)
      const validatorOutput = await k8s.install({
        helmChart: this.bdkFile.getNodeChartPath(),
        name: `validator-${i + 1}`,
        namespace: clusterConfig.namespace,
        values: this.bdkFile.getValidatorChartPath(i),
      }) as DockerResultType
      spinner.succeed(`Helm install validator chart ${i + 1} ${validatorOutput.stdout}`)
    }
    for (let i = 0; i < memberNumber; i += 1) {
      spinner.start(`Helm install member chart ${i + 1}`)
      const memberOutput = await k8s.install({
        helmChart: this.bdkFile.getNodeChartPath(),
        name: `member-${i + 1}`,
        namespace: clusterConfig.namespace,
        values: this.bdkFile.getMemberChartPath(i),
      }) as DockerResultType
      spinner.succeed(`Helm install member chart ${i + 1} ${memberOutput.stdout}`)
    }
  }

  /**
   * @description Use helm create quorum template
   */
  public async generate (
    clusterGenerateConfig: ClusterGenerateType,
    networkCreateConfig: ClusterCreateType,
  ): Promise<void> {
    const { provider, region, chainId, validatorNumber, memberNumber, networkType } = networkCreateConfig
    const clusterConfig = getClusterConfig(networkType)
    this.bdkFile.checkHelmChartPath()
    // create genesis and account
    const genesisYaml = new clusterConfig.genesisConfig()
    genesisYaml.setProvider(provider, region)
    genesisYaml.setGenesis(chainId, validatorNumber, networkType)

    this.bdkFile.createGenesisChartValues(genesisYaml)

    const validatorYaml = new clusterConfig.validatorConfig()
    validatorYaml.setProvider(provider, region)
    validatorYaml.setQuorumConfigs()

    for (let i = 0; i < validatorNumber; i += 1) {
      this.bdkFile.createValidatorChartValues(validatorYaml, i)
    }

    const memberYaml = new clusterConfig.memberConfig()
    memberYaml.setProvider(provider, region)
    memberYaml.setQuorumConfigs()
    for (let i = 0; i < memberNumber; i += 1) {
      this.bdkFile.createMemberChartValues(memberYaml, i)
    }

    if (clusterGenerateConfig.chartPackageModeEnabled) {
      const k8s = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
      const genesisOutput = await k8s.template({
        helmChart: this.bdkFile.getGenesisChartPath(),
        name: 'genesis',
        namespace: clusterConfig.namespace,
        values: this.bdkFile.getGenesisChartPath(),
      }) as DockerResultType
      this.bdkFile.createYaml('genesis', genesisOutput.stdout)

      for (let i = 0; i < validatorNumber; i += 1) {
        const validatorOutput = await k8s.template({
          helmChart: this.bdkFile.getNodeChartPath(),
          name: `validator-${i + 1}`,
          namespace: clusterConfig.namespace,
          values: this.bdkFile.getValidatorChartPath(i),
        }) as DockerResultType
        this.bdkFile.createYaml(`validator-${i + 1}`, validatorOutput.stdout)
      }
      for (let i = 0; i < memberNumber; i += 1) {
        const memberOutput = await k8s.template({
          helmChart: this.bdkFile.getNodeChartPath(),
          name: `member-${i + 1}`,
          namespace: clusterConfig.namespace,
          values: this.bdkFile.getMemberChartPath(i),
        }) as DockerResultType
        this.bdkFile.createYaml(`member-${i + 1}`, memberOutput.stdout)
      }
    }
    this.exportChartTar()
  }

  /**
   * @description Delete all quorum deployment and service
   */
  public async delete (networkType: NetworkType ): Promise<void> {
    const clusterConfig = getClusterConfig(networkType)
    const k8s = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
    const releases = await this.getAllHelmRelease(clusterConfig.namespace)
    await Promise.all(releases.map(async (release: string) => {
      await k8s.delete({ name: release, namespace: clusterConfig.namespace })
    }))
  }

  private async getAllHelmRelease (namespace: string) {
    const k8s = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
    const releases = await k8s.listAllRelease(namespace) as DockerResultType
    return releases.stdout.split('\n').slice(1)
  }

  public getHelmChartFiles (): string[] {
    return this.bdkFile.getHelmChartValuesFiles()
  }

  public removeHelmChartFiles (): void {
    this.bdkFile.removeHelmChart()
  }

  private exportChartTar () {
    const bdkPath = this.bdkFile.getBdkPath()
    const createOpts = {
      gzip: true,
      cwd: bdkPath,
      sync: true,
    }
    try {
      tar
        .c(createOpts, ['helm'])
        .pipe(this.bdkFile.createChartTar('chart', tarDateFormat(new Date())))
    } catch (e: any) {
      throw new Error(`[x] tar error: ${e.message}`)
    }
  }
}
