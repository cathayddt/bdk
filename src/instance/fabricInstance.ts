import { Config } from '../config'
import { OrgTypeEnum } from '../model/type/config.type'
import { InfraRunner, InfraRunnerResultType } from './infra/InfraRunner.interface'
import { AbstractInstance } from './Instance.abstract'

interface OptionsType {
  tag?: string
  volumes?: string[]
  network?: string
}

export default class FabricInstance extends AbstractInstance {
  private orgAddress: string

  constructor (config: Config, infra: InfraRunner<InfraRunnerResultType>, orgAddress?: string) {
    super(config, infra)
    this.orgAddress = orgAddress || `${this.config.hostname}.${this.config.orgDomainName}`
  }

  private async infraRunCommand (
    commands: string[],
    peerOrOrderer?: OrgTypeEnum,
    env?: string[],
    volumes?: string[],
    options?: OptionsType,
  ) {
    return await this.infra.runCommand({
      image: 'hyperledger/fabric-tools',
      tag: options?.tag || this.config.fabricVersion.tools,
      network: this.config.networkName,
      volumes: options?.volumes || [`${this.hostPath}/${this.config.networkName}:${this.dockerPath}`].concat(volumes || []),
      envFile: `${this.hostPath}/${this.config.networkName}/env/${peerOrOrderer}-${this.orgAddress}.env`,
      env: env,
      commands: commands,
    })
  }

  public async createChannel (
    channelName: string,
    orderer: string,
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer', 'channel', 'create',
        '--channelID', channelName,
        '--file', `${this.dockerPath}/channel-artifacts/${channelName}/${channelName}.tx`,
        '--outputBlock', `${this.dockerPath}/channel-artifacts/${channelName}/${channelName}.block`,
        '--orderer', orderer,
        '--ordererTLSHostnameOverride', orderer.split(':')[0],
        '--tls', '--cafile', `${this.dockerPath}/tlsca/${orderer.split(':')[0]}/ca.crt`,
      ],
      OrgTypeEnum.PEER,
      undefined,
      undefined, options)
  }

  public async joinChannel (
    channelName: string,
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer', 'channel', 'join',
        '--blockpath', `${this.dockerPath}/channel-artifacts/${channelName}/${channelName}.block`,
      ],
      OrgTypeEnum.PEER,
      undefined,
      undefined,
      options)
  }

  public async updateAnchorPeer (
    channelName: string,
    orderer: string,
    orgName: string = this.config.orgName,
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer', 'channel', 'update',
        '--channelID', channelName,
        '--file', `${this.dockerPath}/channel-artifacts/${channelName}/${orgName}Anchors.tx`,
        '--orderer', orderer,
        '--ordererTLSHostnameOverride', orderer.split(':')[0],
        '--tls', '--cafile', `${this.dockerPath}/tlsca/${orderer.split(':')[0]}/ca.crt`,
      ],
      OrgTypeEnum.PEER,
      undefined,
      undefined,
      options)
  }

  // * get joined channel of a peer
  public async listJoinedChannel (
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer', 'channel', 'list',
      ],
      OrgTypeEnum.PEER,
      undefined,
      undefined,
      options)
  }

  public async signConfigTx (
    signType: OrgTypeEnum,
    channelName: string,
    input: string,
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer', 'channel', 'signconfigtx',
        '-f', `${this.dockerPath}/channel-artifacts/${channelName}/${input}.pb`,
      ],
      signType,
      undefined,
      undefined,
      options)
  }

  public async updateChannelConfig (
    signType: OrgTypeEnum,
    orderer: string,
    channelName: string,
    input: string,
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer', 'channel', 'update',
        '-c', channelName,
        '-f', `${this.dockerPath}/channel-artifacts/${channelName}/${input}.pb`,
        '--orderer', orderer,
        '--ordererTLSHostnameOverride', orderer.split(':')[0],
        '--tls', '--cafile', `${this.dockerPath}/tlsca/${orderer.split(':')[0]}/ca.crt`,
      ],
      signType,
      undefined,
      undefined,
      options)
  }

  public async installChaincode (
    chaincodeLabel: string,
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer',
        'lifecycle',
        'chaincode',
        'install',
        `${this.dockerPath}/chaincode/${chaincodeLabel}.tar.gz`,
      ],
      OrgTypeEnum.PEER,
      undefined,
      undefined,
      options)
  }

  public async queryInstalledChaincode (
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer',
        'lifecycle',
        'chaincode',
        'queryinstalled',
      ],
      OrgTypeEnum.PEER,
      undefined,
      undefined,
      options)
  }

  public async approveChaincode (
    channelName: string,
    chaincodeName: string,
    chaincodeVersion: number,
    packageId: string,
    initRequired: boolean,
    orderer: string,
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer',
        'lifecycle',
        'chaincode',
        'approveformyorg',
        '--channelID', channelName,
        '--name', chaincodeName,
        '--version', chaincodeVersion.toString(),
        '--package-id', packageId,
        '--sequence', chaincodeVersion.toString(),
        '--orderer', orderer,
        '--ordererTLSHostnameOverride', orderer.split(':')[0],
        '--tls', '--cafile', `${this.dockerPath}/tlsca/${orderer.split(':')[0]}/ca.crt`,
      ]
        .concat(initRequired ? ['--init-required'] : []),
      OrgTypeEnum.PEER,
      undefined,
      undefined,
      options)
  }

  public async commitChaincode (
    channelName: string,
    chaincodeName: string,
    chaincodeVersion: number,
    initRequired: boolean,
    orderer: string,
    peerAddresses: string[],
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer',
        'lifecycle',
        'chaincode',
        'commit',
        '--channelID', channelName,
        '--name', chaincodeName,
        '--version', chaincodeVersion.toString(),
        '--sequence', chaincodeVersion.toString(),
        '--orderer', orderer,
        '--ordererTLSHostnameOverride', orderer.split(':')[0],
        '--tls', '--cafile', `${this.dockerPath}/tlsca/${orderer.split(':')[0]}/ca.crt`,
      ]
        .concat(initRequired ? ['--init-required'] : []).concat(...peerAddresses.map(peerAddress => ['--peerAddresses', peerAddress, '--tlsRootCertFiles', `${this.dockerPath}/tlsca/${peerAddress.split(':')[0]}/ca.crt`])),
      OrgTypeEnum.PEER,
      undefined,
      undefined,
      options)
  }

  public async invokeChaincode (channelName: string,
    chaincodeName: string,
    chaincodeFunction: string,
    args: string[],
    isInit: boolean,
    orderer: string,
    peerAddresses: string[],
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer',
        'chaincode',
        'invoke',
        '--channelID', channelName,
        '--name', chaincodeName,
        '--ctor', JSON.stringify({ function: chaincodeFunction, args: args.map(x => x.toString()) }),
        '--orderer', orderer,
        '--ordererTLSHostnameOverride', orderer.split(':')[0],
        '--tls', '--cafile', `${this.dockerPath}/tlsca/${orderer.split(':')[0]}/ca.crt`,
        '--waitForEvent',
      ]
        .concat(isInit ? ['--isInit'] : [])
        .concat(...peerAddresses.map(peerAddress => ['--peerAddresses', peerAddress, '--tlsRootCertFiles', `${this.dockerPath}/tlsca/${peerAddress.split(':')[0]}/ca.crt`])),
      OrgTypeEnum.PEER,
      undefined,
      undefined, options)
  }

  public async queryChaincode (
    channelName: string,
    chaincodeName: string,
    chaincodeFunction: string,
    args: string[],
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer',
        'chaincode',
        'query',
        '--channelID', channelName,
        '--name', chaincodeName,
        '--ctor', JSON.stringify({ function: chaincodeFunction, args: args.map(x => x.toString()) }),
      ],
      OrgTypeEnum.PEER,
      undefined,
      undefined,
      options)
  }

  public async queryCommittedChaincode (
    channelName: string,
    options?: OptionsType): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer',
        'lifecycle',
        'chaincode',
        'querycommitted',
        '--channelID', channelName,
      ],
      OrgTypeEnum.PEER,
      undefined,
      undefined,
      options)
  }

  // * get AnchorPeers and Orderer of a channel
  public async fetchChannelConfig (
    channelName: string,
    outputFileName: string,
    outputExtension: 'pb' | 'block' = 'block',
    orderer: string | undefined,
    signType: OrgTypeEnum,
    options?: OptionsType,
  ): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer', 'channel', 'fetch', 'config',
        `${this.dockerPath}/channel-artifacts/${channelName}/${outputFileName}.${outputExtension}`,
        '--channelID', channelName,
      ].concat(
        orderer
          ? [
            '--orderer', orderer,
            '--ordererTLSHostnameOverride', orderer.split(':')[0],
            '--tls', '--cafile', `${this.dockerPath}/tlsca/${orderer.split(':')[0]}/ca.crt`,
          ]
          : [],
      ),
      signType,
      undefined,
      undefined,
      options)
  }

  // * get channel block 0
  public async fetchChannelBlock0 (
    channelName: string,
    fileName: string,
    outputExtension: 'pb' | 'block' = 'block',
    orderer: string | undefined,
    signType: OrgTypeEnum,
    options?: OptionsType): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer', 'channel', 'fetch', '0',
        `${this.dockerPath}/channel-artifacts/${channelName}/${fileName}.${outputExtension}`,
        '--channelID', channelName,
      ].concat(
        orderer
          ? [
            '--orderer', orderer,
            '--ordererTLSHostnameOverride', orderer.split(':')[0],
            '--tls', '--cafile', `${this.dockerPath}/tlsca/${orderer.split(':')[0]}/ca.crt`,
          ]
          : [],
      ),
      signType,
      undefined,
      undefined,
      options)
  }

  // * fetch channel newest block
  public async fetchChannelNewestBlock (
    channelName: string,
    fileName: string,
    outputExtension: 'pb' | 'block' = 'block',
    orderer: string | undefined,
    signType: OrgTypeEnum,
    options?: OptionsType): Promise<InfraRunnerResultType> {
    return await this.infraRunCommand(
      [
        'peer', 'channel', 'fetch', 'newest',
        `${this.dockerPath}/channel-artifacts/${channelName}/${fileName}.${outputExtension}`,
        '--channelID', channelName,
      ].concat(
        orderer
          ? [
            '--orderer', orderer,
            '--ordererTLSHostnameOverride', orderer.split(':')[0],
            '--tls', '--cafile', `${this.dockerPath}/tlsca/${orderer.split(':')[0]}/ca.crt`,
          ]
          : [],
      ),
      signType,
      undefined,
      undefined,
      options)
  }
}
