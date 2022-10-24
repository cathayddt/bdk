import ExplorerDockerComposeYaml from '../model/yaml/docker-compose/explorerDockerComposeYaml'
import fs from 'fs-extra'
import { Config } from '../config'
import { GenesisJsonType } from '../model/type/network.type'
import ValidatorDockerComposeYaml from '../model/yaml/docker-compose/validatorDockerComposeYaml'
import MemberDockerComposeYaml from '../model/yaml/docker-compose/memberDockerCompose'

export enum InstanceTypeEnum {
  validator = 'validator',
  member = 'member',
  explorer = 'explorer'
}

export default class BdkFile {
  private config: Config
  private bdkPath: string
  private envPath: string
  private orgPath: string

  constructor (config: Config, networkName: string = config.networkName) {
    this.config = config
    this.bdkPath = `${config.infraConfig.bdkPath}/${networkName}`
    this.envPath = `${config.infraConfig.bdkPath}/.env`
    this.orgPath = ''
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
    return fs.readFileSync(`${this.bdkPath}/artifacts/validator${i}/nodekey.pub`)
  }

  public getMemberPublicKey (i: number) {
    return fs.readFileSync(`${this.bdkPath}/artifacts/member${i}/nodekey.pub`)
  }

  public copyStaticNodesJsonToPermissionedNodesJson () {
    this.createArtifactsFolder()
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/static-nodes.json`, `${this.bdkPath}/artifacts/goQuorum/permissioned-nodes.json`)
  }

  public createValidatorFolder (i: number) {
    fs.mkdirSync(`${this.bdkPath}/Validator-${i}/data/keystore`, { recursive: true })
  }

  public copyGenesisJsonToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/genesis.json`, `${this.bdkPath}/Validator-${i}/data/genesis.json`)
  }

  public copyStaticNodesJsonToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/static-nodes.json`, `${this.bdkPath}/Validator-${i}/data/static-nodes.json`)
  }

  public copyPermissionedNodesJsonToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/permissioned-nodes.json`, `${this.bdkPath}/Validator-${i}/data/permissioned-nodes.json`)
  }

  public copyPrivateKeyToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/validator${i}/nodekey`, `${this.bdkPath}/Validator-${i}/data/nodekey`)
  }

  public copyPublicKeyToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/validator${i}/nodekey.pub`, `${this.bdkPath}/Validator-${i}/data/nodekey.pub`)
  }

  public copyAddressToValidator (i: number) {
    this.createValidatorFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/validator${i}/address`, `${this.bdkPath}/Validator-${i}/data/address`)
  }

  public createMemberFolder (i: number) {
    fs.mkdirSync(`${this.bdkPath}/Member-${i}/data/keystore`, { recursive: true })
  }

  public copyGenesisJsonToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/genesis.json`, `${this.bdkPath}/Member-${i}/data/genesis.json`)
  }

  public copyStaticNodesJsonToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/static-nodes.json`, `${this.bdkPath}/Member-${i}/data/static-nodes.json`)
  }

  public copyPermissionedNodesJsonToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/goQuorum/permissioned-nodes.json`, `${this.bdkPath}/Member-${i}/data/permissioned-nodes.json`)
  }

  public copyPrivateKeyToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/member${i}/nodekey`, `${this.bdkPath}/Member-${i}/data/nodekey`)
  }

  public copyPublicKeyToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/member${i}/nodekey.pub`, `${this.bdkPath}/Member-${i}/data/nodekey.pub`)
  }

  public copyAddressToMember (i: number) {
    this.createMemberFolder(i)
    fs.copyFileSync(`${this.bdkPath}/artifacts/member${i}/address`, `${this.bdkPath}/Member-${i}/data/address`)
  }

  public getBdkPath () {
    return `${this.bdkPath}`
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
}
