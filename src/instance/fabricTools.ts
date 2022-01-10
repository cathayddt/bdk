import { ConfigtxlatorEnum } from '../model/type/channel.type'
import { logger } from '../util'
import { DockerResultType, InfraRunnerResultType } from './infra/InfraRunner.interface'
import { AbstractInstance } from './Instance.abstract'

interface OptionsType {
  tag?: string
  volumes?: string[]
  network?: string
}

export default class FabricTools extends AbstractInstance {
  private async infraRunCommand (
    commands: string[],
    env?: string[],
    volumes?: string[],
    options?: OptionsType,
  ) {
    return await this.infra.runCommand({
      image: 'hyperledger/fabric-tools',
      tag: options?.tag || this.config.fabricVersion.tools,
      network: options?.network,
      volumes: options?.volumes || [`${this.hostPath}/${this.config.networkName}:${this.dockerPath}`].concat(volumes || []),
      env: env,
      commands: commands,
    })
  }

  public async cryptogenGenerateCryptoConfig (options?: OptionsType) {
    await this.infraRunCommand([
      'cryptogen',
      'generate',
      `--config=${this.dockerPath}/config-yaml/crypto-config.yaml`,
      `--output=${this.dockerPath}`,
    ],
    undefined,
    undefined,
    options)
  }

  public async cryptogenGenerateGenesisBlock (profileName: string, options?: OptionsType) {
    await this.infraRunCommand([
      'configtxgen',
      '-profile', profileName,
      '-channelID', 'system-channel',
      '-outputBlock', `${this.dockerPath}/channel-artifacts/system-channel/genesis.block`,
    ],
    [`FABRIC_CFG_PATH=${this.dockerPath}/config-yaml`],
    undefined,
    options)
  }

  public async convertChannelConfigtxToTx (channelName: string, options?: OptionsType) {
    await this.infraRunCommand([
      'configtxgen',
      '-configPath', `${this.dockerPath}/config-yaml/${channelName}Channel`,
      '-profile', `${channelName}Channel`,
      '-outputCreateChannelTx', `${this.dockerPath}/channel-artifacts/${channelName}/${channelName}.tx`,
      '-channelID', channelName,
    ],
    undefined,
    undefined,
    options)
  }

  public async generateAnchorPeerTx (channelName: string, orgName: string = this.config.orgName, options?: OptionsType) {
    await this.infraRunCommand([
      'configtxgen',
      '-configPath', `${this.dockerPath}/config-yaml/${channelName}Channel`,
      '-profile', `${channelName}Channel`,
      '-outputAnchorPeersUpdate', `${this.dockerPath}/channel-artifacts/${channelName}/${orgName}Anchors.tx`,
      '-channelID', channelName,
      '-asOrg', `${orgName}`,
    ],
    undefined,
    undefined,
    options)
  }

  public async decodeChannelConfig (channelName: string, options?: OptionsType) {
    await this.infraRunCommand([
      'configtxlator', 'proto_decode',
      '--type', 'common.Block',
      '--input', `${this.dockerPath}/channel-artifacts/${channelName}/${channelName}.block`,
      '--output', `${this.dockerPath}/channel-artifacts/${channelName}/${channelName}.json`,
    ],
    undefined,
    undefined,
    options)
  }

  public async decodeProto (type: ConfigtxlatorEnum, channelName: string, input: string, output: string, options?: OptionsType) {
    await this.infraRunCommand([
      'configtxlator', 'proto_decode',
      '--type', type,
      '--input', `${this.dockerPath}/channel-artifacts/${channelName}/${input}.pb`,
      '--output', `${this.dockerPath}/channel-artifacts/${channelName}/${output}.json`,
    ],
    undefined,
    undefined,
    options)
  }

  public async encodeProto (type: ConfigtxlatorEnum, channelName: string, input: string, output: string, options?: OptionsType) {
    await this.infraRunCommand([
      'configtxlator', 'proto_encode',
      '--type', type,
      '--input', `${this.dockerPath}/channel-artifacts/${channelName}/${input}.json`,
      '--output', `${this.dockerPath}/channel-artifacts/${channelName}/${output}.pb`,
    ],
    undefined,
    undefined,
    options)
  }

  public async computeUpdateProto (channelName: string, originalFile: string, updatedFile: string, outputFile: string, options?: OptionsType) {
    await this.infraRunCommand([
      'configtxlator', 'compute_update',
      '--channel_id', channelName,
      '--original', `${this.dockerPath}/channel-artifacts/${channelName}/${originalFile}.pb`,
      '--updated', `${this.dockerPath}/channel-artifacts/${channelName}/${updatedFile}.pb`,
      '--output', `${this.dockerPath}/channel-artifacts/${channelName}/${outputFile}.pb`,
    ],
    undefined,
    undefined,
    options)
  }

  public async printOrgDefinitionJson (orgName: string, options?: OptionsType): Promise<DockerResultType> {
    const result = await this.infraRunCommand([
      'configtxgen',
      '-printOrg', `${orgName}`,
      '-configPath', `${this.config.infraConfig.dockerPath}/config-yaml/`,
    ],
    undefined,
    undefined,
    options)
    if (!('stdout' in result)) {
      logger.error('this function only for docker infra')
      throw new Error('this function only for docker infra')
    }
    return result
  }

  public async packageChaincode (chaincodeName: string, chaincodeVersion: number, chaincodePath: string, options?: OptionsType) {
    const chaincodeLang = 'golang'
    const chaincodeLabel = `${chaincodeName}_${chaincodeVersion}`
    await this.infraRunCommand([
      'peer', 'lifecycle', 'chaincode', 'package', `${this.dockerPath}/chaincode/${chaincodeLabel}.tar.gz`,
      '--path', '/chaincode',
      '--lang', chaincodeLang,
      '--label', chaincodeLabel,
    ],
    ['GOCACHE=/tmp/gocache'],
    [`${chaincodePath}:/chaincode`],
    options)
  }

  public async discoverPeers (channel: string, options?: OptionsType): Promise<InfraRunnerResultType> {
    const envFile = this.bdkFile.getOrgConfigEnv(`peer-${this.config.hostname}.${this.config.orgDomainName}`)
    return await this.infraRunCommand([
      'discover', 'peers',
      '--peerTLSCA', envFile.CORE_PEER_TLS_ROOTCERT_FILE,
      '--userKey', `${envFile.CORE_PEER_MSPCONFIGPATH}/keystore/${this.bdkFile.getAdminPrivateKeyFilename(this.config.orgDomainName)}`,
      '--userCert', `${envFile.CORE_PEER_MSPCONFIGPATH}/signcerts/${this.bdkFile.getAdminSignCertFilename(this.config.orgDomainName)}`,
      '--MSP', envFile.CORE_PEER_LOCALMSPID,
      '--server', envFile.CORE_PEER_ADDRESS,
      '--channel', channel,
    ],
    undefined,
    undefined,
    { ...options, network: this.config.networkName })
  }

  public async discoverChannelConfig (channel: string, options?: OptionsType): Promise<InfraRunnerResultType> {
    const envFile = this.bdkFile.getOrgConfigEnv(`peer-${this.config.hostname}.${this.config.orgDomainName}`)
    return await this.infraRunCommand([
      'discover', 'config',
      '--peerTLSCA', envFile.CORE_PEER_TLS_ROOTCERT_FILE,
      '--userKey', `${envFile.CORE_PEER_MSPCONFIGPATH}/keystore/${this.bdkFile.getAdminPrivateKeyFilename(this.config.orgDomainName)}`,
      '--userCert', `${envFile.CORE_PEER_MSPCONFIGPATH}/signcerts/${this.bdkFile.getAdminSignCertFilename(this.config.orgDomainName)}`,
      '--MSP', envFile.CORE_PEER_LOCALMSPID,
      '--server', envFile.CORE_PEER_ADDRESS,
      '--channel', channel,
    ],
    undefined,
    undefined,
    { ...options, network: this.config.networkName })
  }

  public async discoverChaincodeEndorsers (channel: string, chaincode: string, options?: OptionsType): Promise<InfraRunnerResultType> {
    const envFile = this.bdkFile.getOrgConfigEnv(`peer-${this.config.hostname}.${this.config.orgDomainName}`)
    return await this.infraRunCommand([
      'discover', 'endorsers',
      '--peerTLSCA', envFile.CORE_PEER_TLS_ROOTCERT_FILE,
      '--userKey', `${envFile.CORE_PEER_MSPCONFIGPATH}/keystore/${this.bdkFile.getAdminPrivateKeyFilename(this.config.orgDomainName)}`,
      '--userCert', `${envFile.CORE_PEER_MSPCONFIGPATH}/signcerts/${this.bdkFile.getAdminSignCertFilename(this.config.orgDomainName)}`,
      '--MSP', envFile.CORE_PEER_LOCALMSPID,
      '--server', envFile.CORE_PEER_ADDRESS,
      '--channel', channel,
      '--chaincode', chaincode,
    ],
    undefined,
    undefined,
    { ...options, network: this.config.networkName })
  }
}
