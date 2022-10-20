// import path from 'path'
// import YAML from 'js-yaml'
// import { parse, stringify } from 'envfile'
// import CryptoConfigYaml from '../model/yaml/network/cryptoConfigYaml'
// import ConnectionProfileYaml from '../model/yaml/network/connectionProfileYaml'
// import { ConfigEnvType } from '../model/type/config.type'
// import ValidatorDockerComposeYaml from '../model/yaml/docker-compose/validatorDockerComposeYaml'
// import MemberDockerComposeYaml from '../model/yaml/docker-compose/memberDockerComposeYaml'

// import { DockerComposeYamlInterface } from '../model/yaml/docker-compose/dockerComposeYaml'
// import ExplorerConnectionProfileYaml from '../model/yaml/explorer/explorerConnectionProfileYaml'
// import ExplorerConfigYaml from '../model/yaml/explorer/explorerConfigYaml'
// import ExplorerDockerComposeYaml from '../model/yaml/docker-compose/explorerDockerComposeYaml'
import fs from 'fs-extra'
import { Config } from '../config'
import { GenesisJsonType } from '../model/type/network.type'

export enum InstanceTypeEnum {
  validator = 'validator',
  member = 'member'
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
  // public createDockerComposeYaml (hostName: string, dockerComposeYaml: ValidatorDockerComposeYaml | MemberDockerComposeYaml) {
  //   const type: InstanceTypeEnum = (() => {
  //     if (dockerComposeYaml instanceof ValidatorDockerComposeYaml) {
  //       return InstanceTypeEnum.validator
  //     } else if (dockerComposeYaml instanceof MemberDockerComposeYaml) {
  //       return InstanceTypeEnum.member
  //     }
  //     return InstanceTypeEnum.validator
  //   })()

  //   fs.mkdirSync(`${this.bdkPath}/docker-compose`, { recursive: true })
  //   fs.writeFileSync(this.getDockerComposeYamlPath(hostName, type), dockerComposeYaml.getYamlString())
  // }

  // docker run --rm -u $(id -u):$(id -g) -v $PWD/Validator-${I}/data:/data quorumengineering/quorum:22.7.0 init --datadir '/data' /data/genesis.json
  // docker run -d \
  //   -u $(id -u):$(id -g) \
  //   --restart always \
  //   -v $PWD/Validator-${I}/data:/data \
  //   --network quorum \
  //   -p $((8545 + $I)):8545 \
  //   --name validator-${I} \
  //   -e PRIVATE_CONFIG=ignore \
  //   quorumengineering/quorum:22.7.0 \
  //   --datadir '/data' \
  //   --nodiscover --verbosity 3 \
  //   --syncmode full --gcmode=archive \
  //   --mine --miner.threads 1 --miner.gasprice 0 \
  //   --emitcheckpoints \
  //   --http --http.addr 0.0.0.0 --http.port 8545 --http.corsdomain "*" --http.vhosts "*" \
  //   --ws --ws.addr 0.0.0.0 --ws.port 8546 --ws.origins "*" \
  //   --http.api admin,trace,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul,qbft \
  //   --ws.api admin,trace,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul,qbft \
  //   --port 30303

  // public getRootFilePath () {
  //   return this.bdkPath
  // }

  // public getEnv (): ConfigEnvType {
  //   if (!fs.existsSync(this.envPath)) throw new ProcessError('Missing process: Run <bdk fabric config init> first')
  //   return parse(fs.readFileSync(this.envPath).toString()) as unknown as ConfigEnvType
  // }

  // public createEnv (initEnv: ConfigEnvType) {
  //   fs.mkdirSync(`${this.config.infraConfig.bdkPath}`, { recursive: true })
  //   fs.writeFileSync(this.envPath, stringify(initEnv))
  // }

  // public deleteNetworkFolder () {
  //   fs.rmSync(`${this.bdkPath}`, { recursive: true })
  // }

  // public createNetworkFolder () {
  //   fs.mkdirSync(`${this.bdkPath}`, { recursive: true })
  // }

  // public createCaFolder () {
  //   fs.mkdirSync(`${this.bdkPath}/ca`, { recursive: true })
  // }

  // private createConfigYamlFolder () {
  //   fs.mkdirSync(`${this.bdkPath}/config-yaml`, { recursive: true })
  // }

  // private createConfigYamlOrgsFolder () {
  //   fs.mkdirSync(`${this.bdkPath}/config-yaml/orgs`, { recursive: true })
  // }

  // private createTlsFolder (orgDomainName: string) {
  //   fs.mkdirSync(`${this.bdkPath}/tlsca/${orgDomainName}`, { recursive: true })
  // }

  // public createChannelFolder (channelName: string) {
  //   fs.mkdirSync(`${this.bdkPath}/channel-artifacts/${channelName}`, { recursive: true })
  // }

  // public createCryptoConfigYaml (cryptoConfigYaml: CryptoConfigYaml) {
  //   this.createConfigYamlFolder()
  //   fs.writeFileSync(`${this.bdkPath}/config-yaml/crypto-config.yaml`, cryptoConfigYaml.getYamlString())
  // }

  // public createConfigtx (configtxYaml: ConfigtxYaml) {
  //   this.createConfigYamlFolder()
  //   fs.writeFileSync(`${this.bdkPath}/config-yaml/configtx.yaml`, configtxYaml.getYamlString())
  // }

  // public createConfigtxPeerOrg (peerOrg: PeerOrganizationInterface) {
  //   this.createConfigYamlOrgsFolder()
  //   fs.writeFileSync(`${this.bdkPath}/config-yaml/orgs/peer-${peerOrg.Name}.json`, JSON.stringify(peerOrg))
  // }

  // public createConfigtxOrdererOrg (ordererOrg: OrdererOrganizationInterface) {
  //   this.createConfigYamlOrgsFolder()
  //   fs.writeFileSync(`${this.bdkPath}/config-yaml/orgs/orderer-${ordererOrg.Name}.json`, JSON.stringify(ordererOrg))
  // }

  // public getOrdererServerCertToBase64 (hostname: string, domain: string) {
  //   return fs.readFileSync(`${this.bdkPath}/ordererOrganizations/${domain}/orderers/${hostname}.${domain}/tls/server.crt`).toString('base64')
  // }

  // public getConfigtxOrgs (): ConfigtxOrgs {
  //   const configtxOrgs: ConfigtxOrgs = {
  //     ordererOrgs: {},
  //     peerOrgs: {},
  //   }
  //   fs.readdirSync(`${this.bdkPath}/config-yaml/orgs`).forEach((filename: string) => {
  //     const peerOrg = filename.match(/(?<=^peer-).*(?=\.json$)/)?.[0]
  //     const ordererOrg = filename.match(/(?<=^orderer-).*(?=\.json$)/)?.[0]
  //     if (ordererOrg) {
  //       configtxOrgs.ordererOrgs[ordererOrg] = JSON.parse(fs.readFileSync(`${this.bdkPath}/config-yaml/orgs/${filename}`).toString())
  //     } else if (peerOrg) {
  //       configtxOrgs.peerOrgs[peerOrg] = JSON.parse(fs.readFileSync(`${this.bdkPath}/config-yaml/orgs/${filename}`).toString())
  //     }
  //   },
  //   )
  //   return configtxOrgs
  // }

  // public copyOrdererOrgTLSCa (hostname: string, domain: string) {
  //   this.createTlsFolder(`${hostname}.${domain}`)
  //   fs.copyFileSync(`${this.bdkPath}/ordererOrganizations/${domain}/orderers/${hostname}.${domain}/tls/ca.crt`, `${this.bdkPath}/tlsca/${hostname}.${domain}/ca.crt`)
  // }

  // public copyPeerOrgTLSCa (hostname: string, domain: string) {
  //   this.createTlsFolder(`${hostname}.${domain}`)
  //   fs.copyFileSync(`${this.bdkPath}/peerOrganizations/${domain}/peers/${hostname}.${domain}/tls/ca.crt`, `${this.bdkPath}/tlsca/${hostname}.${domain}/ca.crt`)
  // }

  // public getPeerOrgTlsCertString (number: number, domain: string) {
  //   // TODO: if ca is more then 2 layer
  //   let tlsCert = fs.readFileSync(`${this.bdkPath}/peerOrganizations/${domain}/peers/peer${number}.${domain}/tls/ca.crt`).toString()
  //   if (fs.pathExistsSync(`${this.bdkPath}/peerOrganizations/${domain}/peers/peer${number}.${domain}/tls/tlscacerts`)) {
  //     tlsCert = tlsCert + fs.readFileSync(this.newestFileInFolder(`${this.bdkPath}/peerOrganizations/${domain}/peers/peer${number}.${domain}/tls/tlscacerts`)).toString()
  //   }
  //   return tlsCert
  // }

  // public getPeerOrgCaCertString (domain: string) {
  //   return fs.readFileSync(`${this.bdkPath}/peerOrganizations/${domain}/ca/ca.${domain}-cert.pem`).toString()
  // }

  // public getChannelConfigString (channelName: string, fileName: string) {
  //   return fs.readFileSync(`${this.bdkPath}/channel-artifacts/${channelName}/${fileName}.json`).toString()
  // }

  // public getOrgConfigJson (name: string) {
  //   return fs.readFileSync(`${this.bdkPath}/org-json/${name}.json`).toString()
  // }

  // public getOrdererOrgConsenter (name: string) {
  //   return fs.readFileSync(`${this.bdkPath}/org-json/${name}-consenter.json`).toString()
  // }

  // public createConnectionFile (name: string, domain: string, connectionProfileYaml: ConnectionProfileYaml) {
  //   fs.writeFileSync(`${this.bdkPath}/peerOrganizations/${domain}/connection-${name}.json`, connectionProfileYaml.getJsonString())
  //   fs.writeFileSync(`${this.bdkPath}/peerOrganizations/${domain}/connection-${name}.yaml`, connectionProfileYaml.getYamlString())
  // }

  // public getConnectionFile (name: string, domain: string): ConnectionProfileYaml {
  //   return new ConnectionProfileYaml(JSON.parse(fs.readFileSync(`${this.bdkPath}/peerOrganizations/${domain}/connection-${name}.json`).toString()))
  // }

  // public getDockerComposeYamlPath (hostName: string, type: InstanceTypeEnum): string {
  //   return `${this.bdkPath}/docker-compose/docker-compose-${type}-${hostName}.yaml`
  // }

  // private getExplorerRootFilePath () {
  //   return `${this.bdkPath}/fabric-explorer`
  // }

  // private createExplorerFolder () {
  //   fs.mkdirSync(`${this.getExplorerRootFilePath()}/connection-profile`, { recursive: true })
  // }

  // public getExplorerDockerComposeYamlPath (): string {
  //   return `${this.getExplorerRootFilePath()}/docker-compose.yaml`
  // }

  // public createDockerComposeYaml (hostName: string, dockerComposeYaml: OrdererDockerComposeYaml | PeerDockerComposeYaml | CaDockerComposeYaml) {
  //   const type: InstanceTypeEnum = (() => {
  //     if (dockerComposeYaml instanceof OrdererDockerComposeYaml) {
  //       return InstanceTypeEnum.orderer
  //     } else if (dockerComposeYaml instanceof PeerDockerComposeYaml) {
  //       return InstanceTypeEnum.peer
  //     } else if (dockerComposeYaml instanceof CaDockerComposeYaml) {
  //       return InstanceTypeEnum.ca
  //     }
  //     return InstanceTypeEnum.orderer
  //   })()

  //   fs.mkdirSync(`${this.bdkPath}/docker-compose`, { recursive: true })
  //   fs.writeFileSync(this.getDockerComposeYamlPath(hostName, type), dockerComposeYaml.getYamlString())
  // }

  // public createExplorerDockerComposeYaml (explorerConnectionProfileYaml: ExplorerDockerComposeYaml) {
  //   this.createExplorerFolder()
  //   fs.writeFileSync(this.getExplorerDockerComposeYamlPath(), explorerConnectionProfileYaml.getYamlString())
  // }

  // public getDockerComposeYaml (hostName: string, type: InstanceTypeEnum): DockerComposeYamlInterface {
  //   return YAML.load(fs.readFileSync(this.getDockerComposeYamlPath(hostName, type)).toString()) as DockerComposeYamlInterface
  // }

  // public createOrgConfigEnv (filename: string, dotEnv: string) {
  //   fs.mkdirSync(`${this.bdkPath}/env`, { recursive: true })
  //   fs.writeFileSync(`${this.bdkPath}/env/${filename}.env`, dotEnv)
  // }

  // public getOrgConfigEnv (filename: string) {
  //   return parse(fs.readFileSync(`${this.bdkPath}/env/${filename}.env`).toString())
  // }

  // private createChannelConfigtxFolder (channelName: string) {
  //   fs.mkdirSync(`${this.bdkPath}/config-yaml/${channelName}Channel`, { recursive: true })
  // }

  // public createChannelConfigtx (channelName: string, configtxYaml: ConfigtxYaml) {
  //   this.createChannelConfigtxFolder(channelName)
  //   fs.writeFileSync(`${this.bdkPath}/config-yaml/${channelName}Channel/configtx.yaml`, configtxYaml.getYamlString())
  // }

  // public createChannelArtifactFolder (channelName: string) {
  //   fs.mkdirSync(`${this.bdkPath}/channel-artifacts/${channelName}`, { recursive: true })
  // }

  // public createChaincodeFolder () {
  //   fs.mkdirSync(`${this.bdkPath}/chaincode`, { recursive: true })
  // }

  // public createOrgDefinitionJson (name: string, orgJson: string) {
  //   fs.mkdirSync(`${this.bdkPath}/org-json`, { recursive: true })
  //   fs.writeFileSync(`${this.bdkPath}/org-json/${name}.json`, orgJson)
  // }

  // public createOrdererOrgConsenterJson (name: string, consenterJson: string) {
  //   fs.mkdirSync(`${this.bdkPath}/org-json`, { recursive: true })
  //   fs.writeFileSync(`${this.bdkPath}/org-json/${name}-consenter.json`, consenterJson)
  // }

  // public createExportOrgDefinitionJson (exportOrgJson: OrgJsonType, file: string) {
  //   const splitFilePath = file.split('/', 3)
  //   for (let i = 0; i < splitFilePath.length - 1; i++) {
  //     fs.mkdirSync(`${splitFilePath[i]}`, { recursive: true })
  //   }
  //   fs.writeFileSync(`${file}`, JSON.stringify(exportOrgJson))
  // }

  // public createChannelConfigJson (channelName: string, fileName: string, channelConfigJson: string) {
  //   fs.writeFileSync(`${this.bdkPath}/channel-artifacts/${channelName}/${fileName}.json`, channelConfigJson)
  // }

  // public createExplorerConnectionProfile (networkName: string, explorerConnectionProfileYaml: ExplorerConnectionProfileYaml) {
  //   this.createExplorerFolder()
  //   fs.writeFileSync(
  //     `${this.getExplorerRootFilePath()}/connection-profile/${networkName}.json`, explorerConnectionProfileYaml.getJsonString(),
  //   )
  // }

  // public createExplorerConfig (explorerConfig: ExplorerConfigYaml) {
  //   this.createExplorerFolder()
  //   fs.writeFileSync(
  //     `${this.getExplorerRootFilePath()}/config.json`, explorerConfig.getJsonString(),
  //   )
  // }

  // public getExplorerConfig (): ExplorerConfigYaml {
  //   return new ExplorerConfigYaml(JSON.parse(fs.readFileSync(`${this.getExplorerRootFilePath()}/config.json`).toString()))
  // }

  // public getDockerComposeList (): {peer: string[]; orderer: string[]; ca: string[]} {
  //   const dockerComposeFiles = fs.existsSync(`${this.bdkPath}/docker-compose`) ? fs.readdirSync(`${this.bdkPath}/docker-compose`).map(fileName => fileName.match(/(?<=^docker-compose-).*(?=.yaml$)/)?.[0]).filter(x => x !== undefined) as string[] : []

  //   return (() => {
  //     const dccList = { peer: [] as string[], orderer: [] as string[], ca: [] as string[] }

  //     dockerComposeFiles.forEach(fileName => {
  //       if (fileName.startsWith('orderer-')) dccList.orderer.push(fileName.slice(8))
  //       else if (fileName.startsWith('peer-')) dccList.peer.push(fileName.slice(5))
  //       else if (fileName.startsWith('ca-')) dccList.ca.push(fileName.slice(3))
  //     })

  //     return dccList
  //   })()
  // }

  // private setOrgPath (orgName: string, type: string) {
  //   this.orgPath = `${this.bdkPath}/${type}Organizations/${orgName}`
  // }

  // public caFormatOrg (orgName: string, clientId: string, type: string, hostname: string) {
  //   this.setOrgPath(hostname, type)

  //   fs.mkdirSync(`${this.orgPath}/ca`, { recursive: true })
  //   fs.mkdirSync(`${this.orgPath}/msp/admincerts`, { recursive: true })
  //   fs.mkdirSync(`${this.orgPath}/msp/tlscacerts`, { recursive: true })
  //   fs.mkdirSync(`${this.orgPath}/msp/tlsintermediatecerts`, { recursive: true })
  //   // fs.mkdirSync(`${this.orgPath}/tls`, { recursive: true })

  //   fs.copySync(
  //     `${this.bdkPath}/ca/${clientId}@${orgName}/msp`,
  //     `${this.orgPath}/msp`,
  //   )
  //   fs.copyFileSync(
  //     this.newestFileInFolder(`${this.orgPath}/msp/cacerts`),
  //     `${this.orgPath}/msp/tlscacerts/tlsca.${hostname}-cert.pem`,
  //   )
  //   fs.copySync(
  //     `${this.orgPath}/msp/intermediatecerts`,
  //     `${this.orgPath}/msp/tlsintermediatecerts`,
  //   )
  //   fs.copyFileSync(
  //     this.newestFileInFolder(`${this.orgPath}/msp/intermediatecerts`),
  //     `${this.orgPath}/ca/ca.${hostname}-cert.pem`,
  //   )

  //   fs.writeFileSync(`${this.orgPath}/msp/config.yaml`, 'NodeOUs:\n  Enable: true\n  ClientOUIdentifier:\n    OrganizationalUnitIdentifier: client\n  PeerOUIdentifier:\n    OrganizationalUnitIdentifier: peer\n  AdminOUIdentifier:\n    OrganizationalUnitIdentifier: admin\n  OrdererOUIdentifier:\n    OrganizationalUnitIdentifier: orderer\n')
  // }

  // public caFormatOrderer (orgName: string, ordererName: string, hostname: string) {
  //   this.setOrgPath(hostname, 'orderer')

  //   fs.mkdirSync(`${this.orgPath}/orderers/${ordererName}/msp/admincerts`, { recursive: true })
  //   fs.mkdirSync(`${this.orgPath}/orderers/${ordererName}/msp/tlscacerts`, { recursive: true })
  //   fs.mkdirSync(`${this.orgPath}/orderers/${ordererName}/msp/tlsintermediatecerts`, { recursive: true })

  //   fs.copySync(
  //     `${this.bdkPath}/ca/${ordererName}@${orgName}`,
  //     `${this.orgPath}/orderers/${ordererName}`,
  //   )
  //   fs.copySync(
  //     `${this.orgPath}/orderers/${ordererName}/msp/cacerts`,
  //    `${this.orgPath}/orderers/${ordererName}/msp/tlscacerts`,
  //   )
  //   fs.copySync(
  //     `${this.orgPath}/orderers/${ordererName}/msp/intermediatecerts`,
  //     `${this.orgPath}/orderers/${ordererName}/msp/tlsintermediatecerts`,
  //   )
  //   // TODO 實驗能否直接做成 cachain ，加上 rca cert    ../tlscacerts/*.pem
  //   fs.copyFileSync(
  //     this.newestFileInFolder(`${this.orgPath}/orderers/${ordererName}/tls/tlsintermediatecerts`),
  //     `${this.orgPath}/orderers/${ordererName}/tls/ca.crt`,
  //   )
  //   fs.copyFileSync(
  //     this.newestFileInFolder(`${this.orgPath}/orderers/${ordererName}/tls/signcerts`),
  //     `${this.orgPath}/orderers/${ordererName}/tls/server.crt`,
  //   )
  //   fs.copyFileSync(
  //     this.newestFileInFolder(`${this.orgPath}/orderers/${ordererName}/tls/keystore`),
  //     `${this.orgPath}/orderers/${ordererName}/tls/server.key`,
  //   )
  //   fs.copyFileSync(
  //     this.newestFileInFolder(`${this.orgPath}/orderers/${ordererName}/tls/keystore`),
  //     `${this.orgPath}/orderers/${ordererName}/tls/keystore/priv_sk`,
  //   )

  //   const userList = fs.existsSync(`${this.orgPath}/users/`) ? fs.readdirSync(`${this.orgPath}/users/`) : []
  //   userList.forEach((user) => {
  //     if (user.toLocaleLowerCase().startsWith('admin')) {
  //       fs.copySync(
  //       `${this.orgPath}/users/${user}/msp/signcerts/`,
  //       `${this.orgPath}/orderers/${ordererName}/msp/admincerts`,
  //       )
  //     }
  //   })
  // }

  // public caFormatPeer (orgName: string, peerName: string, hostname: string) {
  //   this.setOrgPath(hostname, 'peer')

  //   fs.mkdirSync(`${this.orgPath}/peers/${peerName}/msp/admincerts`, { recursive: true })
  //   fs.mkdirSync(`${this.orgPath}/peers/${peerName}/msp/tlscacerts`, { recursive: true })
  //   fs.mkdirSync(`${this.orgPath}/peers/${peerName}/msp/tlsintermediatecerts`, { recursive: true })

  //   fs.copySync(
  //     `${this.bdkPath}/ca/${peerName}@${orgName}`,
  //     `${this.orgPath}/peers/${peerName}`,
  //   )
  //   // TODO GitHub Actions buffer overflow temporary solution
  //   try {
  //     fs.copyFileSync(
  //       this.newestFileInFolder(`${this.orgPath}/peers/${peerName}/msp/cacerts`),
  //       `${this.orgPath}/peers/${peerName}/msp/tlscacerts/tlsca.${hostname}-cert.pem`)
  //   } catch {
  //     fs.copyFileSync(
  //       this.newestFileInFolder(`${this.orgPath}/peers/${peerName}/msp/cacerts`),
  //       `${this.orgPath}/peers/${peerName}/msp/tlscacerts/tlsca.${hostname}-cert.pem`)
  //   }
  //   fs.copySync(
  //     `${this.orgPath}/peers/${peerName}/msp/intermediatecerts`,
  //     `${this.orgPath}/peers/${peerName}/msp/tlsintermediatecerts`,
  //   )
  //   // TODO 實驗能否直接做成 cachain ，加上 rca cert    ../tlscacerts/*.pem
  //   fs.copyFileSync(
  //     this.newestFileInFolder(`${this.orgPath}/peers/${peerName}/tls/tlsintermediatecerts`),
  //     `${this.orgPath}/peers/${peerName}/tls/ca.crt`,
  //   )
  //   fs.copyFileSync(
  //     this.newestFileInFolder(`${this.orgPath}/peers/${peerName}/tls/signcerts`),
  //     `${this.orgPath}/peers/${peerName}/tls/server.crt`,
  //   )
  //   fs.copyFileSync(
  //     this.newestFileInFolder(`${this.orgPath}/peers/${peerName}/tls/keystore`),
  //     `${this.orgPath}/peers/${peerName}/tls/server.key`,
  //   )
  //   fs.copyFileSync(
  //     this.newestFileInFolder(`${this.orgPath}/peers/${peerName}/tls/keystore`),
  //     `${this.orgPath}/peers/${peerName}/tls/keystore/priv_sk`,
  //   )

  //   const userList = fs.existsSync(`${this.orgPath}/users/`) ? fs.readdirSync(`${this.orgPath}/users/`) : []
  //   userList.forEach((user) => {
  //     if (user.toLocaleLowerCase().startsWith('admin')) {
  //       fs.copySync(
  //       `${this.orgPath}/users/${user}/msp/signcerts/`,
  //       `${this.orgPath}/peers/${peerName}/msp/admincerts`,
  //       )
  //     }
  //   })
  // }

  // public caFormatUser (orgName: string, userName: string, type: string, hostname: string) {
  //   this.setOrgPath(hostname, type)

  //   fs.mkdirSync(`${this.orgPath}/users/${userName}`, { recursive: true })

  //   fs.copySync(
  //     `${this.bdkPath}/ca/${userName}@${orgName}/user`,
  //     `${this.orgPath}/users/${userName}/msp`,
  //   )
  //   fs.copySync(
  //     `${this.orgPath}/users/${userName}/msp/signcerts/`,
  //     `${this.orgPath}/msp/admincerts`,
  //   )
  //   fs.copySync(
  //     `${this.orgPath}/users/${userName}/msp/signcerts/`,
  //     `${this.orgPath}/users/${userName}/msp/admincerts`,
  //   )

  //   if (userName.toLocaleLowerCase().startsWith('admin') && fs.existsSync(`${this.orgPath}/${type}s/`)) {
  //     fs.readdirSync(`${this.orgPath}/${type}s/`).forEach((hostname) => {
  //       fs.copySync(
  //       `${this.orgPath}/users/${userName}/msp/signcerts/`,
  //       `${this.orgPath}/${type}s/${hostname}/msp/admincerts`,
  //       )
  //     })
  //   }
  // }

  // public static newestFileName (folderName: string) {
  //   const files: string[] = fs.readdirSync(folderName)
  //   const newest = { fileName: 'stub', created: new Date('December 31, 1999 00:00:00') }
  //   files.forEach(function (file) {
  //     const stats = fs.statSync(path.join(folderName, file))
  //     if (stats.ctime > newest.created) {
  //       newest.fileName = file
  //       newest.created = stats.ctime
  //     }
  //   })
  //   return newest.fileName
  // }

  // private newestFileInFolder (folderName: string) {
  //   return `${folderName}/${BdkFile.newestFileName(folderName)}`
  // }

  // private createPackageIdFolder () {
  //   fs.mkdirSync(`${this.bdkPath}/chaincode/package-id`, { recursive: true })
  // }

  // public savePackageId (chaincodeLabel: string, packageId: string) {
  //   this.createPackageIdFolder()
  //   fs.writeFileSync(`${this.bdkPath}/chaincode/package-id/${chaincodeLabel}`, packageId)
  // }

  // public getPackageId (chaincodeLabel: string): string {
  //   if (!fs.existsSync(`${this.bdkPath}/chaincode/package-id/${chaincodeLabel}`)) {
  //     throw new Error('Should install chaincode or getChaincodePackageId first')
  //   }
  //   return fs.readFileSync(`${this.bdkPath}/chaincode/package-id/${chaincodeLabel}`).toString()
  // }

  // public getDecodedChannelConfig (channelName: string): any {
  //   return JSON.parse(fs.readFileSync(`${this.bdkPath}/channel-artifacts/${channelName}/${channelName}.json`).toString())
  // }

  // public getAdminPrivateKeyPem (domain: string): string {
  //   return fs.readFileSync(this.newestFileInFolder(`${this.bdkPath}/peerOrganizations/${domain}/users/Admin@${domain}/msp/keystore`)).toString()
  // }

  // public getAdminPrivateKeyFilename (domain: string): string {
  //   return BdkFile.newestFileName(`${this.bdkPath}/peerOrganizations/${domain}/users/Admin@${domain}/msp/keystore`)
  // }

  // public getAdminSignCert (domain: string): string {
  //   return fs.readFileSync(this.newestFileInFolder(`${this.bdkPath}/peerOrganizations/${domain}/users/Admin@${domain}/msp/signcerts`)).toString()
  // }

  // public getAdminSignCertFilename (domain: string): string {
  //   return BdkFile.newestFileName(`${this.bdkPath}/peerOrganizations/${domain}/users/Admin@${domain}/msp/signcerts`)
  // }

  // public getChannelJson (channel: string, filename: string): string {
  //   return fs.readFileSync(`${this.bdkPath}/channel-artifacts/${channel}/${filename}.json`).toString()
  // }
}
