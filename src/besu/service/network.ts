import { ethers } from 'ethers'
import RLP from 'rlp'
import { NetworkCreateType, NetworkInfoItem } from '../model/type/network.type'
import GenesisJsonYaml from '../model/yaml/network/gensisJson'
import { AbstractService } from './Service.abstract'
import ValidatorInstance from '../instance/validator'
import ValidatorDockerComposeYaml from '../model/yaml/docker-compose/validatorDockerComposeYaml'
import MemberDockerComposeYaml from '../model/yaml/docker-compose/memberDockerCompose'
import MemberInstance from '../instance/member'

export default class Network extends AbstractService {
  /**
   * @description 建立 besu network
   */
  public async create (networkCreateConfig: NetworkCreateType) {
    const validatorAddressList: Buffer[] = []
    const networkInfo: NetworkInfoItem[] = []
    for (let i = 0; i < networkCreateConfig.validatorNumber; i += 1) {
      const { address } = this.createKey(`artifacts/validator${i}`)
      validatorAddressList.push(Buffer.from(address, 'hex'))
    }
    for (let i = 0; i < networkCreateConfig.memberNumber; i += 1) {
      this.createKey(`artifacts/member${i}`)
    }

    const extraDataContent = [new Uint8Array(32), validatorAddressList, [], null, []]
    const extraDataCoded = RLP.encode(extraDataContent)
    const extraData = `0x${Buffer.from(extraDataCoded).toString('hex')}`

    const alloc: { [address: string]: { balance: string } } = {}
    networkCreateConfig.alloc.forEach(x => {
      alloc[`0x${x.account.replace(/^0x/, '').toLowerCase()}`] = { balance: x.amount }
    })

    const genesisJsonYaml = new GenesisJsonYaml()
    genesisJsonYaml.addExtraData(extraData)
    genesisJsonYaml.addChainId(networkCreateConfig.chainId)
    genesisJsonYaml.addAlloc(alloc)
    const genesisJson = JSON.parse(genesisJsonYaml.getJsonString())

    this.bdkFile.createArtifactsFolder()
    this.bdkFile.createGenesisJson(genesisJson)

    this.bdkFile.createDisallowedNodesJson([])
    const staticNodesJson: string[] = []
    const bdkPath = this.bdkFile.getBdkPath()

    for (let i = 0; i < networkCreateConfig.validatorNumber; i += 1) {
      const validatorPublicKey = this.bdkFile.getValidatorPublicKey(i)
      const validatorNode = `enode://${validatorPublicKey}@127.0.0.1:${30303 + i}`
      staticNodesJson.push(validatorNode)
    }
    for (let i = 0; i < networkCreateConfig.memberNumber; i += 1) {
      const memberPublicKey = this.bdkFile.getMemberPublicKey(i)
      const memberNode = `enode://${memberPublicKey}@127.0.0.1:${30403 + i}`
      staticNodesJson.push(memberNode)
    }

    this.bdkFile.createStaticNodesJson(staticNodesJson)
    this.bdkFile.copyStaticNodesJsonToPermissionedNodesJson()

    // Process validator node
    const validatorDockerComposeYaml = new ValidatorDockerComposeYaml()
    for (let i = 0; i < networkCreateConfig.validatorNumber; i += 1) {
      this.bdkFile.copyGenesisJsonToValidator(i)
      this.bdkFile.copyStaticNodesJsonToValidator(i)
      this.bdkFile.copyPermissionedNodesJsonToValidator(i)

      this.bdkFile.copyPrivateKeyToValidator(i)
      this.bdkFile.copyPublicKeyToValidator(i)
      this.bdkFile.copyAddressToValidator(i)

      validatorDockerComposeYaml.addValidator(bdkPath, i, 8545 + i * 2, networkCreateConfig.chainId, 30303 + i, networkCreateConfig.bootNodeList[i], staticNodesJson[i])
      this.createNetworkInfoJson(networkInfo, `http://validator${i}:${8545 + i * 2}`)
    }
    this.bdkFile.createValidatorDockerComposeYaml(validatorDockerComposeYaml)

    await (new ValidatorInstance(this.config, this.infra).up())

    // Process Member node
    if (networkCreateConfig.memberNumber > 0) {
      const memberDockerComposeYaml = new MemberDockerComposeYaml()
      for (let i = 0; i < networkCreateConfig.memberNumber; i += 1) {
        this.bdkFile.copyGenesisJsonToMember(i)
        this.bdkFile.copyStaticNodesJsonToMember(i)
        this.bdkFile.copyPermissionedNodesJsonToMember(i)

        this.bdkFile.copyPrivateKeyToMember(i)
        this.bdkFile.copyPublicKeyToMember(i)
        this.bdkFile.copyAddressToMember(i)

        memberDockerComposeYaml.addMember(bdkPath, i, 8645 + i * 2, networkCreateConfig.chainId, 30403 + i, networkCreateConfig.bootNodeList[networkCreateConfig.validatorNumber + i], staticNodesJson[networkCreateConfig.validatorNumber + i])
        this.createNetworkInfoJson(networkInfo, `http://member${i}:${8645 + i * 2}`)
      }
      this.bdkFile.createMemberDockerComposeYaml(memberDockerComposeYaml)

      await (new MemberInstance(this.config, this.infra).up())
    }
    this.bdkFile.createNetworkInfoJson(networkInfo)
  }

  /** @ignore */
  private createKey (dir: string) {
    // TODO: use Shawn's code generate key
    const nodekey = ethers.Wallet.createRandom()
    const privateKey = nodekey.privateKey.replace(/^0x/, '')
    const publicKey = nodekey.publicKey.replace(/^0x04/, '')
    const address = nodekey.address.replace(/^0x/, '').toLowerCase()

    this.bdkFile.createPrivateKey(dir, privateKey)
    this.bdkFile.createPublicKey(dir, publicKey)
    this.bdkFile.createAddress(dir, address)

    return { privateKey, publicKey, address }
  }

  /** @ignore */
  private createNetworkInfoJson (networkInfo: NetworkInfoItem[], endpoint: string) {
    const match = endpoint.match(/((http[s]?):\/\/((validator|member)\d+)):(\d+)/)
    if (!match) {
      throw new Error('Invalid URL format')
    }
    const label = match[3]
    const protocol = match[2]
    const host = label.startsWith('validator') || label.startsWith('member') ? 'localhost' : label
    const value = `${protocol}://${host}:${match[5]}`
    networkInfo.push({ label, value })
  }

  /** @ignore */
  public createBdkFolder () {
    return this.bdkFile.createBdkFolder()
  }

  /** @ignore */
  public getNetworkFiles () {
    const networkFilesList = this.bdkFile.getExportFiles().filter(
      file => file.match(/(validator|member|artifacts|network-info)+/g),
    )
    return networkFilesList
  }

  /** @ignore */
  public removeBdkFiles (files: string[]) {
    for (const file of files) {
      this.bdkFile.removeBdkFiles(file)
    }
  }
}
