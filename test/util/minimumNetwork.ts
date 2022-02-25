import fs from 'fs'
import config, { Config } from '../../src/config'
import Network from '../../src/service/network'
import { NetworkCreateType } from '../../src/model/type/network.type'
import Peer from '../../src/service/peer'
import Orderer from '../../src/service/orderer'
import Channel from '../../src/service/channel'
import Chaincode from '../../src/service/chaincode'
import { OrgTypeEnum } from '../../src/model/type/config.type'
import { PolicyTypeEnum } from '../../src/model/type/channel.type'

export default class MinimumNetwork {
  public networkCreateJson: NetworkCreateType
  public org0PeerConfig: Config
  public org0OrdererConfig: Config
  public channelName: string
  public chaincodeName: string
  private networkService: Network
  private peerService: Peer
  private ordererService: Orderer
  private channelServiceOrg0Peer: Channel
  private chaincodeServiceOrg0Peer: Chaincode

  constructor () {
    this.networkCreateJson = JSON.parse(fs.readFileSync('./cicd/test_script/network-create-min.json').toString())
    this.channelName = 'test-channel'
    this.chaincodeName = 'fabcar'
    this.org0PeerConfig = {
      ...config,
      orgType: OrgTypeEnum.PEER,
      orgName: this.getPeer().orgName,
      orgDomainName: this.getPeer().orgDomain,
      hostname: this.getPeer().hostname,
    }
    this.org0OrdererConfig = {
      ...config,
      orgType: OrgTypeEnum.ORDERER,
      orgName: this.getOrderer().orgName,
      orgDomainName: this.getOrderer().orgDomain,
      hostname: this.getOrderer().hostname,
    }
    this.networkService = new Network(config)
    this.peerService = new Peer(config)
    this.ordererService = new Orderer(config)
    this.channelServiceOrg0Peer = new Channel(this.org0PeerConfig)
    this.chaincodeServiceOrg0Peer = new Chaincode(this.org0PeerConfig)
  }

  public getPeer (orgIndex: number = 0, peerIndex: number = 0) {
    return {
      orgName: this.networkCreateJson.peerOrgs[orgIndex].name,
      orgDomain: this.networkCreateJson.peerOrgs[orgIndex].domain,
      hostname: `peer${peerIndex}`,
      port: this.networkCreateJson.peerOrgs[orgIndex].ports?.[peerIndex]?.port || 7051,
    }
  }

  public getOrderer (orgIndex: number = 0, ordererIndex: number = 0) {
    const orgName = this.networkCreateJson.ordererOrgs[orgIndex].name
    const orgDomain = this.networkCreateJson.ordererOrgs[orgIndex].domain
    const hostname = this.networkCreateJson.ordererOrgs[orgIndex].hostname[ordererIndex]
    const port = this.networkCreateJson.ordererOrgs[orgIndex]?.ports?.[ordererIndex]?.port || 7050
    return {
      orgName,
      orgDomain,
      hostname,
      port,
      fullUrl: `${hostname}.${orgDomain}:${port}`,
    }
  }

  public createNetworkFolder () {
    this.networkService.createNetworkFolder()
  }

  public async createNetwork () {
    this.createNetworkFolder()
    await this.networkService.cryptogen(this.networkCreateJson)
    this.networkService.copyTLSCa(this.networkCreateJson)
    await this.networkService.createGenesisBlock(this.networkCreateJson)
    this.networkService.createConnectionProfile(this.networkCreateJson)
    this.networkService.createDockerCompose(this.networkCreateJson)
  }

  public async peerAndOrdererUp () {
    await this.peerService.up({ peerHostname: `${this.getPeer().hostname}.${this.getPeer().orgDomain}` })
    await this.ordererService.up({ ordererHostname: `${this.getOrderer().hostname}.${this.getOrderer().orgDomain}` })
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // public async peerAndOrdererDown () {
  //   await this.peerService.down({ peerHostname: `${this.getPeer().hostname}.${this.getPeer().orgDomain}` })
  //   await this.ordererService.down({ ordererHostname: `${this.getOrderer().hostname}.${this.getOrderer().orgDomain}` })
  // }

  public async createChannelAndJoin () {
    await this.channelServiceOrg0Peer.create({
      channelName: this.channelName,
      orgNames: [this.getPeer().orgName],
      channelAdminPolicy: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Admins' },
      lifecycleEndorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
      endorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
      orderer: this.getOrderer().fullUrl,
    })
    await this.channelServiceOrg0Peer.join({
      channelName: this.channelName,
      orderer: this.getOrderer().fullUrl,
    })
    await this.channelServiceOrg0Peer.updateAnchorPeer({
      channelName: this.channelName,
      orderer: this.getOrderer().fullUrl,
      port: this.getPeer().port,
    })
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  public async deployChaincode () {
    await this.chaincodeServiceOrg0Peer.package({
      name: 'fabcar',
      version: 1,
      path: './chaincode/fabcar/go',
    })
    await this.chaincodeServiceOrg0Peer.install({
      chaincodeLabel: `${this.chaincodeName}_1`,
    })
    await this.chaincodeServiceOrg0Peer.approve({
      channelId: this.channelName,
      chaincodeName: this.chaincodeName,
      chaincodeVersion: 1,
      initRequired: true,
    })
    await this.chaincodeServiceOrg0Peer.commit({
      channelId: this.channelName,
      chaincodeName: this.chaincodeName,
      chaincodeVersion: 1,
      initRequired: true,
    })
    await this.chaincodeServiceOrg0Peer.invoke({
      channelId: this.channelName,
      chaincodeName: this.chaincodeName,
      chaincodeFunction: 'InitLedger',
      args: [],
      isInit: true,
    })
  }

  public async deleteNetwork () {
    // await this.peerService.down({ peerHostname: `${this.getPeer().hostname}.${this.getPeer().orgDomain}` })
    // await this.ordererService.down({ ordererHostname: `${this.getOrderer().hostname}.${this.getOrderer().orgDomain}` })
    await this.networkService.delete(config.networkName)
  }
}
