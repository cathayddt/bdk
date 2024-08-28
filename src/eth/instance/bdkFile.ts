import ExplorerDockerComposeYaml from '../model/yaml/docker-compose/explorerDockerComposeYaml'
import fs from 'fs-extra'
import path from 'path'
import { Config } from '../config'
import { GenesisJsonType, NetworkInfoItem } from '../model/type/network.type'
import ValidatorDockerComposeYaml from '../model/yaml/docker-compose/validatorDockerComposeYaml'
import MemberDockerComposeYaml from '../model/yaml/docker-compose/memberDockerCompose'
import { GenesisConfigYaml, ValidatorConfigYaml, MemberConfigYaml } from '../model/yaml/helm-chart'
import { PathError } from '../../util/error'

export enum InstanceTypeEnum {
  validator = 'validator',
  member = 'member',
  explorer = 'explorer'
}

export default class BdkFile {
  private config: Config
  private bdkPath: string
  private helmPath: string
  private backupPath: string
  private envPath: string
  private orgPath: string
  private thisPath = path.resolve(__dirname)

  constructor (config: Config, networkName: string = config.networkName) {
    this.config = config
    this.bdkPath = `${config.infraConfig.bdkPath}/${networkName}`
    this.helmPath = `${this.bdkPath}/helm`
    this.backupPath = `${config.infraConfig.bdkPath}/backup`
    this.envPath = `${config.infraConfig.bdkPath}/.env`
    this.orgPath = ''
  }

  public createBdkFolder () {
    fs.mkdirSync(`${this.bdkPath}`, { recursive: true })
  }

  public createArtifactsFolder () {
    fs.mkdirSync(`${this.bdkPath}/artifacts/goQuorum`, { recursive: true })
  }

  public createGenesisJson (genesisJson: GenesisJsonType) {
    this.createArtifactsFolder()
    fs.writeFileSync(`${this.bdkPath}/artifacts/goQuorum/genesis.json`, JSON.stringify(genesisJson, null, 2))
  }

  public createDisallowedNodesJson (disallowedNodesJson: Array<string>) {
    this.createArtifactsFolder()
    fs.writeFileSync(`${this.bdkPath}/artifacts/goQuorum/disallowed-nodes.json`, JSON.stringify(disallowedNodesJson, null, 2))
  }

  public createStaticNodesJson (staticNodesJson: Array<string>) {
    this.createArtifactsFolder()
    fs.writeFileSync(`${this.bdkPath}/artifacts/goQuorum/static-nodes.json`, JSON.stringify(staticNodesJson, null, 2))
  }

  public createNetworkInfoJson (networkInfoJson: Array<NetworkInfoItem>) {
    fs.writeFileSync(`${this.bdkPath}/network-info.json`, JSON.stringify(networkInfoJson, null, 2))
  }

  public createPrivateKey (dir: string, privateKey: string) {
    fs.mkdirSync(`${this.bdkPath}/${dir}`, { recursive: true })
    fs.writeFileSync(`${this.bdkPath}/${dir}/nodekey`, privateKey)
  }

  public createPublicKey (dir: string, publicKey: string) {
    fs.mkdirSync(`${this.bdkPath}/${dir}`, { recursive: true })
    fs.writeFileSync(`${this.bdkPath}/${dir}/nodekey.pub`, publicKey)
  }

  public createAddress (dir: string, address: string) {
    fs.mkdirSync(`${this.bdkPath}/${dir}`, { recursive: true })
    fs.writeFileSync(`${this.bdkPath}/${dir}/address`, address)
  }

  public getValidatorPublicKey (i: number) {
    this.checkPathExist(`${this.bdkPath}/artifacts/validator${i}`)
    return fs.readFileSync(`${this.bdkPath}/artifacts/validator${i}/nodekey.pub`)
  }

  public getValidatorPrivateKey (i: number) {
    this.checkPathExist(`${this.bdkPath}/artifacts/validator${i}`)
    return fs.readFileSync(`${this.bdkPath}/artifacts/validator${i}/nodekey`)
  }

  public getValidatorAddress (i: number) {
    this.checkPathExist(`${this.bdkPath}/artifacts/validator${i}`)
    return fs.readFileSync(`${this.bdkPath}/artifacts/validator${i}/address`)
  }

  public getValidatorEnodeInfo (i: number) {
    this.checkPathExist(`${this.bdkPath}/artifacts/goQuorum`)
    const staticNodesJson: Array<string> = this.getStaticNodesJson()
    const enodeInfo = staticNodesJson.find(file => file.includes(`validator${i}`))
    return enodeInfo
  }

  public getMemberPublicKey (i: number) {
    this.checkPathExist(`${this.bdkPath}/artifacts/member${i}`)
    return fs.readFileSync(`${this.bdkPath}/artifacts/member${i}/nodekey.pub`)
  }

  public getMemberPrivateKey (i: number) {
    this.checkPathExist(`${this.bdkPath}/artifacts/member${i}`)
    return fs.readFileSync(`${this.bdkPath}/artifacts/member${i}/nodekey`)
  }

  public getMemberAddress (i: number) {
    this.checkPathExist(`${this.bdkPath}/artifacts/member${i}`)
    return fs.readFileSync(`${this.bdkPath}/artifacts/member${i}/address`)
  }

  public getMemberEnodeInfo (i: number) {
    this.checkPathExist(`${this.bdkPath}/artifacts/goQuorum`)
    const staticNodesJson: Array<string> = this.getStaticNodesJson()
    const enodeInfo = staticNodesJson.find(file => file.includes(`member${i}`))
    return enodeInfo
  }

  public copyStaticNodesJsonToPermissionedNodesJson () {
    this.createArtifactsFolder()
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/static-nodes.json`, `${this.bdkPath}/artifacts/goQuorum/permissioned-nodes.json`)
  }

  public createValidatorFolder (i: number) {
    fs.mkdirSync(`${this.bdkPath}/validator${i}/data/keystore`, { recursive: true })
  }

  public copyGenesisJsonToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/genesis.json`, `${this.bdkPath}/validator${i}/data/genesis.json`)
  }

  public copyStaticNodesJsonToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/static-nodes.json`, `${this.bdkPath}/validator${i}/data/static-nodes.json`)
  }

  public copyPermissionedNodesJsonToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/permissioned-nodes.json`, `${this.bdkPath}/validator${i}/data/permissioned-nodes.json`)
  }

  public copyPrivateKeyToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/validator${i}/nodekey`, `${this.bdkPath}/validator${i}/data/nodekey`)
  }

  public copyPublicKeyToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/validator${i}/nodekey.pub`, `${this.bdkPath}/validator${i}/data/nodekey.pub`)
  }

  public copyAddressToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/validator${i}/address`, `${this.bdkPath}/validator${i}/data/address`)
  }

  public createMemberFolder (i: number) {
    fs.mkdirSync(`${this.bdkPath}/member${i}/data/keystore`, { recursive: true })
  }

  public removeBdkFiles (path: string) {
    fs.rmSync(`${this.bdkPath}/${path}`, { recursive: true, force: true })
  }

  public copyGenesisJsonToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/genesis.json`, `${this.bdkPath}/member${i}/data/genesis.json`)
  }

  public copyStaticNodesJsonToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/static-nodes.json`, `${this.bdkPath}/member${i}/data/static-nodes.json`)
  }

  public copyPermissionedNodesJsonToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/permissioned-nodes.json`, `${this.bdkPath}/member${i}/data/permissioned-nodes.json`)
  }

  public copyPrivateKeyToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/member${i}/nodekey`, `${this.bdkPath}/member${i}/data/nodekey`)
  }

  public copyPublicKeyToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/member${i}/nodekey.pub`, `${this.bdkPath}/member${i}/data/nodekey.pub`)
  }

  public copyAddressToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/member${i}/address`, `${this.bdkPath}/member${i}/data/address`)
  }

  public createBackupFolder () {
    fs.mkdirSync(`${this.backupPath}`, { recursive: true })
  }

  public createBackupTar (validatorTag: string, date: string) {
    this.createBackupFolder()
    return fs.createWriteStream(`${this.backupPath}/Backup_${validatorTag}_${date}.tar.gz`)
  }

  public getBdkPath () {
    this.checkPathExist(this.bdkPath)
    return `${this.bdkPath}`
  }

  public getExportFiles () {
    this.checkPathExist(this.bdkPath)
    return fs.readdirSync(this.bdkPath)
  }

  public getGenesisJson () {
    this.checkPathExist(this.bdkPath)
    const genesisJson = fs.readFileSync(`${this.bdkPath}/artifacts/goQuorum/genesis.json`, 'utf8')
    return JSON.parse(genesisJson)
  }

  public getStaticNodesJson () {
    this.checkPathExist(this.bdkPath)
    const staticNodesJson = fs.readFileSync(`${this.bdkPath}/artifacts/goQuorum/static-nodes.json`, 'utf8')
    return JSON.parse(staticNodesJson)
  }

  public getNetworkInfoJson () {
    this.checkPathExist(this.bdkPath)
    const networkInfoJson = fs.readFileSync(`${this.bdkPath}/network-info.json`, 'utf8')
    return JSON.parse(networkInfoJson)
  }

  public getPermissionedNodesJson () {
    this.checkPathExist(this.bdkPath)
    const permissionedNodesJson = fs.readFileSync(`${this.bdkPath}/artifacts/goQuorum/permissioned-nodes.json`, 'utf8')
    return JSON.parse(permissionedNodesJson)
  }

  public getBackupPath () {
    this.checkPathExist(this.backupPath)
    return `${this.backupPath}`
  }

  public getBackupFiles () {
    this.checkPathExist(this.backupPath)
    return fs.readdirSync(this.backupPath)
  }

  public getExplorerDockerComposeYamlPath (): string {
    return `${this.getBdkPath()}/explorer-docker-compose.yaml`
  }

  public getValidatorDockerComposeYamlPath (): string {
    return `${this.getBdkPath()}/validator-docker-compose.yaml`
  }

  public getMemberDockerComposeYamlPath (): string {
    return `${this.getBdkPath()}/member-docker-compose.yaml`
  }

  public createExplorerDockerComposeYaml (explorerConnectionProfileYaml: ExplorerDockerComposeYaml) {
    fs.writeFileSync(this.getExplorerDockerComposeYamlPath(), explorerConnectionProfileYaml.getYamlString())
  }

  public createValidatorDockerComposeYaml (validatorDockerComposeYaml: ValidatorDockerComposeYaml) {
    fs.writeFileSync(this.getValidatorDockerComposeYamlPath(), validatorDockerComposeYaml.getYamlString())
  }

  public createMemberDockerComposeYaml (memberDockerComposeYaml: MemberDockerComposeYaml) {
    fs.writeFileSync(this.getMemberDockerComposeYamlPath(), memberDockerComposeYaml.getYamlString())
  }

  // helm chart files
  public checkHelmChartPath () {
    if (!fs.existsSync(this.helmPath)) {
      fs.copySync(`${this.thisPath}/infra/kubernetes/charts`, this.helmPath, { recursive: true })
    }
  }

  public createYaml (name: string, yaml: string) {
    fs.mkdirSync(`${this.helmPath}/kubernetes`, { recursive: true })
    fs.writeFileSync(`${this.helmPath}/kubernetes/${name}.yaml`, yaml)
  }

  public getGoQuorumGenesisChartPath (): string {
    this.checkHelmChartPath()
    return `${this.helmPath}/goquorum-genesis`
  }
  public getBesuGenesisChartPath (): string {
    this.checkHelmChartPath()
    return `${this.helmPath}/besu-genesis`
  }

  public getGoQuorumNodeChartPath (): string {
    this.checkHelmChartPath()
    return `${this.helmPath}/goquorum-node`
  }

  public getBesuNodeChartPath (): string {
    this.checkHelmChartPath()
    return `${this.helmPath}/besu-node`
  }

  public createChartValueFolder () {
    fs.mkdirSync(`${this.helmPath}/values`, { recursive: true })
  }

  public createGoQuorumValues () {
    this.checkHelmChartPath()
    fs.writeFileSync(`${this.helmPath}/goquorum-values.yaml`, '')
  }

  public copyGoQuorumHelmChart () {
    this.checkHelmChartPath()
    fs.copySync(this.helmPath, './', { recursive: true })
  }

  public createChartTar (tag: string, date: string) {
    return fs.createWriteStream(`./${tag}-${date}.tar.gz`)
  }

  public getValidatorChartPath (i: number): string {
    this.createChartValueFolder()
    return `${this.helmPath}/values/validator${i}-values.yaml`
  }

  public getMemberChartPath (i: number): string {
    this.createChartValueFolder()
    return `${this.helmPath}/values/member${i}-values.yaml`
  }

  public createGenesisChartValues (genesisYaml: GenesisConfigYaml) {
    this.createChartValueFolder()
    fs.writeFileSync(`${this.helmPath}/values/genesis-values.yaml`, genesisYaml.getYamlString())
  }

  public createValidatorChartValues (validatorYaml: ValidatorConfigYaml, i: number) {
    this.createChartValueFolder()
    fs.writeFileSync(`${this.helmPath}/values/validator${i}-values.yaml`, validatorYaml.getYamlString())
  }

  public createMemberChartValues (memberYaml: MemberConfigYaml, i: number) {
    fs.writeFileSync(`${this.helmPath}/values/member${i}-values.yaml`, memberYaml.getYamlString())
  }

  public getGenesisChartPath () {
    return `${this.helmPath}/values/genesis-values.yaml`
  }

  public removeHelmChart () {
    fs.rmSync(`${this.helmPath}`, { recursive: true, force: true })
  }

  public getHelmChartValuesFiles () {
    this.checkHelmChartPath()
    fs.mkdirSync(`${this.helmPath}/values`, { recursive: true })
    return fs.readdirSync(`${this.helmPath}/values`)
  }

  public checkPathExist (path: string) {
    if (!fs.existsSync(path)) {
      throw new PathError(`${path} no exist`)
    }
  }
}
