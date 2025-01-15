import tar from 'tar'
import { Ora } from 'ora'
import { tarDateFormat } from '../../util'
import { AbstractService } from './Service.abstract'
import KubernetesInstance from '../instance/kubernetesCluster'
import { ClusterCreateType, ClusterGenerateType } from '../model/type/kubernetes.type'
import { GenesisConfigYaml, ValidatorConfigYaml, MemberConfigYaml } from '../model/yaml/helm-chart'
import { DockerResultType } from '../instance/infra/InfraRunner.interface'
import { NetworkType } from '../config/network.type'
export default class Cluster extends AbstractService {
  /**
   * @description Use helm create quorum/besu template
   */
  public async apply (networkCreateConfig: ClusterCreateType, spinner: Ora): Promise<void> {
    const { provider, region, chainId, validatorNumber, memberNumber } = networkCreateConfig
    // create genesis and account
    const k8s = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
    this.bdkFile.checkHelmChartPath()
    const alloc: {[address: string]: {balance: string}} = {}
    networkCreateConfig.alloc.forEach(x => {
      alloc[`0x${x.account.replace(/^0x/, '').toLowerCase()}`] = { balance: x.amount }
    })
    const genesisYaml = new GenesisConfigYaml()
    genesisYaml.setProvider(provider, region)
    genesisYaml.setGenesis(chainId, validatorNumber, alloc)

    this.bdkFile.createGenesisChartValues(genesisYaml)
    // custom namespace
    spinner.start('Helm install genesis chart')
    const genesisOutput = await k8s.install({
      helmChart: this.bdkFile.getGenesisChartPath(networkCreateConfig.networkType),
      name: 'genesis',
      namespace: networkCreateConfig.networkType,
      values: this.bdkFile.getGenesisChartValuesPath(),
    }) as DockerResultType
    const genesisJob = networkCreateConfig.networkType === NetworkType.QUORUM ? 'job.batch/goquorum-genesis-init' : 'job.batch/besu-genesis-init'
    await k8s.wait(genesisJob, networkCreateConfig.networkType)
    spinner.succeed(`Helm install genesis chart ${genesisOutput.stdout}`)
    // create network
    const validatorYaml = new ValidatorConfigYaml()
    validatorYaml.setProvider(provider, region)
    validatorYaml.setQuorumConfigs()

    for (let i = 0; i < validatorNumber; i += 1) {
      this.bdkFile.createValidatorChartValues(validatorYaml, i)
    }

    const memberYaml = new MemberConfigYaml()
    memberYaml.setProvider(provider, region)
    memberYaml.setQuorumConfigs()
    for (let i = 0; i < memberNumber; i += 1) {
      this.bdkFile.createMemberChartValues(memberYaml, i)
    }
    for (let i = 0; i < validatorNumber; i += 1) {
      spinner.start(`Helm install validator chart ${i + 1}`)
      const validatorOutput = await k8s.install({
        helmChart: this.bdkFile.getNodeChartPath(networkCreateConfig.networkType),
        name: `validator-${i + 1}`,
        namespace: networkCreateConfig.networkType,
        values: this.bdkFile.getValidatorChartPath(i),
      }) as DockerResultType
      spinner.succeed(`Helm install validator chart ${i + 1} ${validatorOutput.stdout}`)
    }
    for (let i = 0; i < memberNumber; i += 1) {
      spinner.start(`Helm install member chart ${i + 1}`)
      const memberOutput = await k8s.install({
        helmChart: this.bdkFile.getNodeChartPath(networkCreateConfig.networkType),
        name: `member-${i + 1}`,
        namespace: networkCreateConfig.networkType,
        values: this.bdkFile.getMemberChartPath(i),
      }) as DockerResultType
      spinner.succeed(`Helm install member chart ${i + 1} ${memberOutput.stdout}`)
    }
  }

  /**
   * @description Use helm create quorum/besu template
   */
  public async generate (
    clusterGenerateConfig: ClusterGenerateType,
    networkCreateConfig: ClusterCreateType,
  ): Promise<void> {
    const { provider, region, chainId, validatorNumber, memberNumber } = networkCreateConfig
    this.bdkFile.checkHelmChartPath()
    const alloc: {[address: string]: {balance: string}} = {}
    networkCreateConfig.alloc.forEach(x => {
      alloc[`0x${x.account.replace(/^0x/, '').toLowerCase()}`] = { balance: x.amount }
    })
    // create genesis and account
    const genesisYaml = new GenesisConfigYaml()
    genesisYaml.setProvider(provider, region)
    genesisYaml.setGenesis(chainId, validatorNumber, alloc)

    this.bdkFile.createGenesisChartValues(genesisYaml)

    const validatorYaml = new ValidatorConfigYaml()
    validatorYaml.setProvider(provider, region)
    validatorYaml.setQuorumConfigs()

    for (let i = 0; i < validatorNumber; i += 1) {
      this.bdkFile.createValidatorChartValues(validatorYaml, i)
    }

    const memberYaml = new MemberConfigYaml()
    memberYaml.setProvider(provider, region)
    memberYaml.setQuorumConfigs()
    for (let i = 0; i < memberNumber; i += 1) {
      this.bdkFile.createMemberChartValues(memberYaml, i)
    }

    if (clusterGenerateConfig.chartPackageModeEnabled) {
      const k8s = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
      const genesisOutput = await k8s.template({
        helmChart: this.bdkFile.getGenesisChartPath(networkCreateConfig.networkType),
        name: 'genesis',
        namespace: networkCreateConfig.networkType,
        values: this.bdkFile.getGenesisChartValuesPath(),
      }) as DockerResultType
      this.bdkFile.createYaml('genesis', genesisOutput.stdout)

      for (let i = 0; i < validatorNumber; i += 1) {
        const validatorOutput = await k8s.template({
          helmChart: this.bdkFile.getNodeChartPath(networkCreateConfig.networkType),
          name: `validator-${i + 1}`,
          namespace: networkCreateConfig.networkType,
          values: this.bdkFile.getValidatorChartPath(i),
        }) as DockerResultType
        this.bdkFile.createYaml(`validator-${i + 1}`, validatorOutput.stdout)
      }
      for (let i = 0; i < memberNumber; i += 1) {
        const memberOutput = await k8s.template({
          helmChart: this.bdkFile.getNodeChartPath(networkCreateConfig.networkType),
          name: `member-${i + 1}`,
          namespace: networkCreateConfig.networkType,
          values: this.bdkFile.getMemberChartPath(i),
        }) as DockerResultType
        this.bdkFile.createYaml(`member-${i + 1}`, memberOutput.stdout)
      }
    }
    this.exportChartTar()
  }

  /**
   * @description Delete all quorum/besu deployment and service
   */
  public async delete (networkType: string): Promise<void> {
    const k8s = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
    const releases = await this.getAllHelmRelease(networkType)
    await Promise.all(releases.map(async (release: string) => {
      await k8s.delete({ name: release, namespace: networkType })
    }))
  }

  private async getAllHelmRelease (networkType: string): Promise<string[]> {
    const k8s = new KubernetesInstance(this.config, this.infra, this.kubernetesInfra)
    const releases = await k8s.listAllRelease(networkType) as DockerResultType
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
