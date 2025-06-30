import { ethers, JsonRpcProvider } from 'ethers'
import RLP from 'rlp'
import { NetworkCreateType, NetworkGenerateType, JoinNodeType, AddValidatorRemoteType, AddMemberRemoteType, NetworkInfoItem } from '../model/type/network.type'
import GenesisJsonYaml from '../model/yaml/network/gensisJson'
import { AbstractService } from './Service.abstract'
import ValidatorInstance from '../instance/validator'
import ValidatorDockerComposeYaml from '../model/yaml/docker-compose/validatorDockerComposeYaml'
import MemberDockerComposeYaml from '../model/yaml/docker-compose/memberDockerCompose'
import MemberInstance from '../instance/member'
import { DockerResultType } from '../instance/infra/InfraRunner.interface'
import { TimeLimitError } from '../../util/error'
import { sleep } from '../../util/utils'
import { NetworkType } from '../config/network.type'

export default class Network extends AbstractService {
  /**
   * @description 建立 eth network
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

    const extraDataContent = [new Uint8Array(32), validatorAddressList.map(address => new Uint8Array(address)), [], null, []]
    const extraDataCoded = RLP.encode(extraDataContent)
    const extraData = `0x${Buffer.from(extraDataCoded).toString('hex')}`

    const alloc: {[address: string]: {balance: string}} = {}
    networkCreateConfig.alloc.forEach(x => {
      alloc[`0x${x.account.replace(/^0x/, '').toLowerCase()}`] = { balance: x.amount }
    })

    const networkType = (networkCreateConfig.networkType || 'quorum') as NetworkType
    const genesisJsonYaml = new GenesisJsonYaml(networkType)
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
      const validatorNode = `enode://${validatorPublicKey}@validator${i}:${30303 + i}`
      staticNodesJson.push(validatorNode)
    }
    for (let i = 0; i < networkCreateConfig.memberNumber; i += 1) {
      const memberPublicKey = this.bdkFile.getMemberPublicKey(i)
      const memberNode = `enode://${memberPublicKey}@member${i}:${30403 + i}`
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

      validatorDockerComposeYaml.addValidator(bdkPath, i, 8545 + i * 2, networkCreateConfig.chainId, 30303 + i, networkCreateConfig.bootNodeList[i], staticNodesJson[i], networkType)
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

        memberDockerComposeYaml.addMember(bdkPath, i, 8645 + i * 2, networkCreateConfig.chainId, 30403 + i, networkCreateConfig.bootNodeList[networkCreateConfig.validatorNumber + i], staticNodesJson[networkCreateConfig.validatorNumber + i], networkType)
        this.createNetworkInfoJson(networkInfo, `http://member${i}:${8645 + i * 2}`)
      }
      this.bdkFile.createMemberDockerComposeYaml(memberDockerComposeYaml)

      await (new MemberInstance(this.config, this.infra).up())
    }
    this.bdkFile.createNetworkInfoJson(networkInfo)
  }

  public async joinNode (networkType: NetworkType, joinNodeConfig: JoinNodeType) {
    const networkInfo: NetworkInfoItem[] = this.bdkFile.getNetworkInfoJson()
    const nodeNum = Number(joinNodeConfig.node.replace(/(validator|member)+/g, ''))
    const staticNodesJson: string[] = []
    const bdkPath = this.bdkFile.getBdkPath()
    const enodeInfo = String(this.getNodeInfo(joinNodeConfig.node, 'enodeInfo'))
    const publicKey = String(this.getNodeInfo(joinNodeConfig.node, 'publicKey'))
    const address = String(this.getNodeInfo(joinNodeConfig.node, 'address'))

    for (let i = 0; i < joinNodeConfig.staticNodesJson.length; i += 1) {
      if (joinNodeConfig.staticNodesJson[i].includes(publicKey)) {
        staticNodesJson.push(enodeInfo)
      } else {
        staticNodesJson.push(joinNodeConfig.staticNodesJson[i].replace(/(validator|member)[0-9]+/g, joinNodeConfig.ipAddress))
      }
    }

    this.bdkFile.createArtifactsFolder()
    this.bdkFile.createGenesisJson(joinNodeConfig.genesisJson)
    this.bdkFile.createDisallowedNodesJson([])
    this.bdkFile.createStaticNodesJson(staticNodesJson)
    this.bdkFile.copyStaticNodesJsonToPermissionedNodesJson()

    if (joinNodeConfig.node.includes('validator')) {
      this.bdkFile.copyGenesisJsonToValidator(nodeNum)
      this.bdkFile.copyStaticNodesJsonToValidator(nodeNum)
      this.bdkFile.copyPermissionedNodesJsonToValidator(nodeNum)

      const validatorDockerComposeYaml = new ValidatorDockerComposeYaml()

      // TODO: add bootnode selection
      validatorDockerComposeYaml.addValidator(bdkPath, nodeNum, 8545 + nodeNum * 2, joinNodeConfig.genesisJson.config.chainId, 30303 + nodeNum, false, '', networkType)
      this.createNetworkInfoJson(networkInfo, `http://validator${nodeNum}:${8545 + nodeNum * 2}`)
      this.bdkFile.createValidatorDockerComposeYaml(validatorDockerComposeYaml)

      await (new ValidatorInstance(this.config, this.infra).upOneService(`${joinNodeConfig.node}`))
      this.bdkFile.createNetworkInfoJson(networkInfo)

      networkType === NetworkType.QUORUM ? await this.istanbulIsValidator(joinNodeConfig.node) : await this.besuIsValidator(address)

      return nodeNum
    } else {
      this.bdkFile.copyGenesisJsonToMember(nodeNum)
      this.bdkFile.copyStaticNodesJsonToMember(nodeNum)
      this.bdkFile.copyPermissionedNodesJsonToMember(nodeNum)

      const memberDockerComposeYaml = new MemberDockerComposeYaml()
      // TODO: add bootnode selection
      memberDockerComposeYaml.addMember(bdkPath, nodeNum, 8645 + nodeNum * 2, joinNodeConfig.genesisJson.config.chainId, 30403 + nodeNum, false, '', networkType)
      this.createNetworkInfoJson(networkInfo, `http://member${nodeNum}:${8645 + nodeNum * 2}`)
      this.bdkFile.createMemberDockerComposeYaml(memberDockerComposeYaml)

      await (new MemberInstance(this.config, this.infra).upOneService(`${joinNodeConfig.node}`))
      this.bdkFile.createNetworkInfoJson(networkInfo)

      await this.checkPeerCount(networkType, joinNodeConfig.node)

      return nodeNum
    }
  }

  public async addValidatorRemote (addValidatorRemoteConfig: AddValidatorRemoteType, networkType: NetworkType) {
    const validatorCount = await this.bdkFile.getExportFiles().filter(file => file.match(/(validator)[0-9]+/g)).length

    // propose
    for (let i = 0; i < validatorCount; i += 1) {
      networkType === NetworkType.QUORUM ? await this.quorumCommand(`istanbul.propose("${addValidatorRemoteConfig.validatorAddress}", true)`, `validator${i}`) : await this.besuCommand('qbft_proposeValidatorVote', `validator${i}`, `["${addValidatorRemoteConfig.validatorAddress}", true]`)
    }

    const staticNodesJson = this.bdkFile.getStaticNodesJson()
    const remoteValidatorNode = `enode://${addValidatorRemoteConfig.validatorPublicKey}@${addValidatorRemoteConfig.ipAddress}:${addValidatorRemoteConfig.discoveryPort}`
    staticNodesJson.push(remoteValidatorNode)

    this.bdkFile.createStaticNodesJson(staticNodesJson)
    this.bdkFile.copyStaticNodesJsonToPermissionedNodesJson()

    // for loop to copy static-nodes.json to validator
    for (let i = 0; i < validatorCount; i += 1) {
      this.bdkFile.copyStaticNodesJsonToValidator(i)
      this.bdkFile.copyPermissionedNodesJsonToValidator(i)
    }

    // for loop to copy static-nodes.json to member
    const memberCount = await this.bdkFile.getExportFiles().filter(file => file.match(/(member)[0-9]+/g)).length
    for (let i = 0; i < memberCount; i += 1) {
      this.bdkFile.copyStaticNodesJsonToMember(i)
      this.bdkFile.copyPermissionedNodesJsonToMember(i)
    }
  }

  public async addMemberRemote (addMemberRemoteConfig: AddMemberRemoteType) {
    const staticNodesJson = this.bdkFile.getStaticNodesJson()
    const remoteMemberNode = `enode://${addMemberRemoteConfig.memberPublicKey}@${addMemberRemoteConfig.ipAddress}:${addMemberRemoteConfig.discoveryPort}`
    staticNodesJson.push(remoteMemberNode)

    this.bdkFile.createStaticNodesJson(staticNodesJson)
    this.bdkFile.copyStaticNodesJsonToPermissionedNodesJson()

    // for loop to copy static-nodes.json to validator
    const validatorCount = await this.bdkFile.getExportFiles().filter(file => file.match(/(validator)[0-9]+/g)).length
    for (let i = 0; i < validatorCount; i += 1) {
      this.bdkFile.copyStaticNodesJsonToValidator(i)
      this.bdkFile.copyPermissionedNodesJsonToValidator(i)
    }

    // for loop to copy static-nodes.json to member
    const memberCount = await this.bdkFile.getExportFiles().filter(file => file.match(/(member)[0-9]+/g)).length
    for (let i = 0; i < memberCount; i += 1) {
      this.bdkFile.copyStaticNodesJsonToMember(i)
      this.bdkFile.copyPermissionedNodesJsonToMember(i)
    }
  }

  public generate (networkGenerateConfig: NetworkGenerateType) {
    const staticNodesJson: string[] = []
    const networkInfo: NetworkInfoItem[] = []
    // Add node to static-nodes.json
    for (let i = 0; i < networkGenerateConfig.validatorNumber; i += 1) {
      const { publicKey } = this.createKey(`artifacts/validator${i}`)
      const validatorNode = `enode://${publicKey}@validator${i}:${30303 + i}`
      staticNodesJson.push(validatorNode)
    }
    for (let i = 0; i < networkGenerateConfig.memberNumber; i += 1) {
      const { publicKey } = this.createKey(`artifacts/member${i}`)
      const memberNode = `enode://${publicKey}@member${i}:${30403 + i}`
      staticNodesJson.push(memberNode)
    }
    this.bdkFile.createStaticNodesJson(staticNodesJson)

    // Process validator & member node
    for (let i = 0; i < networkGenerateConfig.validatorNumber; i += 1) {
      this.bdkFile.copyPrivateKeyToValidator(i)
      this.bdkFile.copyPublicKeyToValidator(i)
      this.bdkFile.copyAddressToValidator(i)
      this.createNetworkInfoJson(networkInfo, `http://validator${i}:${8545 + i * 2}`)
    }
    for (let i = 0; i < networkGenerateConfig.memberNumber; i += 1) {
      this.bdkFile.copyPrivateKeyToMember(i)
      this.bdkFile.copyPublicKeyToMember(i)
      this.bdkFile.copyAddressToMember(i)
      this.createNetworkInfoJson(networkInfo, `http://member${i}:${8645 + i * 2}`)
    }
    this.bdkFile.createNetworkInfoJson(networkInfo)
  }

  public async addValidatorLocal (networkType: NetworkType) {
    const networkInfo: NetworkInfoItem[] = await this.bdkFile.getNetworkInfoJson()
    // count validator number
    const validatorCount = this.bdkFile.getExportFiles().filter(file => file.match(/(validator)[0-9]+/g)).length
    const validatorNum = validatorCount
    const newValidator = `validator${validatorNum}`
    const { publicKey, address } = this.createKey(`artifacts/${newValidator}`)
    const validatorNode = `enode://${publicKey}@${newValidator}:${30303 + validatorNum}`
    const chainId = networkType === NetworkType.QUORUM ? parseInt(await this.quorumCommand('admin.nodeInfo.protocols.eth.network', 'validator0')) : Number(JSON.parse(await this.besuCommand('net_version', 'validator0', '[""]')))

    this.bdkFile.copyPrivateKeyToValidator(validatorNum)
    this.bdkFile.copyPublicKeyToValidator(validatorNum)
    this.bdkFile.copyAddressToValidator(validatorNum)

    for (let i = 0; i < validatorNum; i += 1) {
      networkType === NetworkType.QUORUM ? await this.quorumCommand(`istanbul.propose("0x${address}", true)`, `validator${i}`) : await this.besuCommand('qbft_proposeValidatorVote', `validator${i}`, `["0x${address}", true]`)
    }

    this.bdkFile.copyGenesisJsonToValidator(validatorNum)

    // read & add new node to static-nodes.json
    const staticNodesJson = this.bdkFile.getStaticNodesJson()
    staticNodesJson.push(validatorNode)
    this.bdkFile.createStaticNodesJson(staticNodesJson)
    this.bdkFile.copyStaticNodesJsonToPermissionedNodesJson()

    // for loop to copy static-nodes.json to validator
    const validatorDockerComposeYaml = new ValidatorDockerComposeYaml()
    for (let i = 0; i < validatorNum + 1; i += 1) {
      this.bdkFile.copyStaticNodesJsonToValidator(i)
      this.bdkFile.copyPermissionedNodesJsonToValidator(i)
      // TODO: add bootnode selection
      validatorDockerComposeYaml.addValidator(this.bdkFile.getBdkPath(), i, 8545 + i * 2, chainId, 30303 + i, false, '', networkType)
      this.createNetworkInfoJson(networkInfo, `http://validator${i}:${8545 + i * 2}`)
    }
    this.bdkFile.createValidatorDockerComposeYaml(validatorDockerComposeYaml)
    this.bdkFile.createNetworkInfoJson(networkInfo)

    // for loop to copy static-nodes.json to member
    const memberCount = await this.bdkFile.getExportFiles().filter(file => file.match(/(member)[0-9]+/g)).length
    for (let i = 0; i < memberCount; i += 1) {
      this.bdkFile.copyStaticNodesJsonToMember(i)
      this.bdkFile.copyPermissionedNodesJsonToMember(i)
    }

    await (new ValidatorInstance(this.config, this.infra).upOneService(`${newValidator}`))
    networkType === NetworkType.QUORUM ? await this.istanbulIsValidator(newValidator) : await this.besuIsValidator(address)

    return validatorNum
  }

  public async addMemberLocal (networkType: NetworkType) {
    const networkInfo: NetworkInfoItem[] = await this.bdkFile.getNetworkInfoJson()
    // count member number
    const memberCount = (await this.bdkFile.getExportFiles().filter(file => file.match(/(member)[0-9]+/g))).length
    const memberNum = memberCount
    const newMember = `member${memberNum}`
    const { publicKey } = this.createKey(`artifacts/${newMember}`)
    const memberNode = `enode://${publicKey}@${newMember}:${30403 + memberNum}`
    const chainId = networkType === NetworkType.QUORUM ? parseInt(await this.quorumCommand('admin.nodeInfo.protocols.eth.network', 'validator0')) : Number(JSON.parse(await this.besuCommand('net_version', 'validator0', '[""]')))

    this.bdkFile.copyPrivateKeyToMember(memberNum)
    this.bdkFile.copyPublicKeyToMember(memberNum)
    this.bdkFile.copyAddressToMember(memberNum)

    this.bdkFile.copyGenesisJsonToMember(memberNum)

    // read & add new node to static-nodes.json
    const staticNodesJson = this.bdkFile.getStaticNodesJson()
    staticNodesJson.push(memberNode)
    this.bdkFile.createStaticNodesJson(staticNodesJson)
    this.bdkFile.copyStaticNodesJsonToPermissionedNodesJson()

    // for loop to copy static-nodes.json to validator
    const validatorCount = networkType === NetworkType.QUORUM ? parseInt(await this.quorumCommand('istanbul.getValidators().length', 'validator0')) : parseInt(JSON.parse(await this.besuCommand('qbft_getValidatorsByBlockNumber', 'validator0', '["latest"]')).length)
    for (let i = 0; i < validatorCount; i += 1) {
      this.bdkFile.copyStaticNodesJsonToValidator(i)
      this.bdkFile.copyPermissionedNodesJsonToValidator(i)
    }

    // for loop to copy static-nodes.json to member
    const memberDockerComposeYaml = new MemberDockerComposeYaml()
    for (let i = 0; i < memberCount + 1; i += 1) {
      this.bdkFile.copyStaticNodesJsonToMember(i)
      this.bdkFile.copyPermissionedNodesJsonToMember(i)
      // TODO: add bootnode selection
      memberDockerComposeYaml.addMember(this.bdkFile.getBdkPath(), i, 8645 + i * 2, chainId, 30403 + i, false, '', networkType)
      this.createNetworkInfoJson(networkInfo, `http://member${i}:${8645 + i * 2}`)
    }
    this.bdkFile.createMemberDockerComposeYaml(memberDockerComposeYaml)
    this.bdkFile.createNetworkInfoJson(networkInfo)
    await (new MemberInstance(this.config, this.infra).upOneService(`${newMember}`))

    await this.checkPeerCount(networkType, newMember)

    return memberNum
  }

  public async checkNode (network: NetworkType, node: string, method: string, params?: string) {
    const result = network === NetworkType.QUORUM ? await this.quorumCommand(method, node) : await this.besuCommand(method, node, params as string)

    return result
  }

  public getNetworkInfo (networkInfo: string) {
    let result

    switch (networkInfo) {
      case 'genesis.json':
        result = JSON.stringify(this.bdkFile.getGenesisJson())
        break

      case 'static-nodes.json':
        result = JSON.stringify(this.bdkFile.getStaticNodesJson())
        break

      case 'permissioned-nodes.json':
        result = JSON.stringify(this.bdkFile.getPermissionedNodesJson())
        break
    }

    return result
  }

  public getNodeInfo (node: string, nodeInfo: string) {
    let result
    const nodeNum = Number(node.replace(/(validator|member)+/g, ''))

    if (node.includes('validator')) {
      switch (nodeInfo) {
        case 'address':
          result = this.bdkFile.getValidatorAddress(nodeNum)
          break

        case 'publicKey':
          result = this.bdkFile.getValidatorPublicKey(nodeNum)
          break

        case 'privateKey':
          result = this.bdkFile.getValidatorPrivateKey(nodeNum)
          break
        case 'enodeInfo':
          result = this.bdkFile.getValidatorEnodeInfo(nodeNum)
          break
      }
    } else if (node.includes('member')) {
      switch (nodeInfo) {
        case 'address':
          result = this.bdkFile.getMemberAddress(nodeNum)
          break

        case 'publicKey':
          result = this.bdkFile.getMemberPublicKey(nodeNum)
          break

        case 'privateKey':
          result = this.bdkFile.getMemberPrivateKey(nodeNum)
          break
        case 'enodeInfo':
          result = this.bdkFile.getMemberEnodeInfo(nodeNum)
          break
      }
    }

    return result
  }

  /**
   * @description network service
   */
  public async upService (service: string) {
    if (service.match(/validator[\w-]+/g)) {
      await (new ValidatorInstance(this.config, this.infra).upOneService(service))
    } else if (service.match(/member[\w-]+/g)) {
      await (new MemberInstance(this.config, this.infra).upOneService(service))
    }
  }

  public async upAll () {
    await (new ValidatorInstance(this.config, this.infra).up())
    await (new MemberInstance(this.config, this.infra).up())
  }

  public async down () {
    await (new ValidatorInstance(this.config, this.infra).down())
    await (new MemberInstance(this.config, this.infra).down())
  }

  public async delete () {
    await this.down()
    this.removeBdkFiles(this.getNetworkFiles())
  }

  /** @ignore */
  private async quorumCommand (args: string, option: string) {
    const result = await this.infra.runCommand({
      autoRemove: true,
      user: false,
      image: 'quorumengineering/quorum',
      tag: '23.4.0',
      volumes: [`${this.bdkFile.getBdkPath()}/${option}/data/geth.ipc:/root/geth.ipc`],
      commands: [
        'attach',
        '/root/geth.ipc',
        '--exec',
        args,
      ],
      ignoreError: true,
    }) as DockerResultType
    // strip ANSI color
    const out = result.stdout.replace(/\s+/g, '').replace(/.\[[0-9;]*m/g, '')
    return out
  }

  private async besuCommand (args: string, option: string, params: string) {
    const result = await this.infra.runCommand({
      autoRemove: true,
      user: false,
      network: 'bdk-besu-network_besu',
      image: 'alpine',
      tag: 'latest',
      commands: [
        'sh',
        '-c',
        `
  apk add -q --no-cache curl &&
  apk add -q --no-cache jq &&
  curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"${args}","params":${params},"id":1}' \
    http://${option}:8545 | jq '.result'
  `,
      ],
      ignoreError: true,
    }) as DockerResultType

    // eslint-disable-next-line no-control-regex
    const out = result.stdout.replace(/\x1b\[[0-9;]*[A-Za-z]|\x1b[0-9A-Za-z]|(\d+%|#+)|[\r\n]+/g, '').replace(/\s+/g, '')
    return out
  }

  /** @ignore */
  private createKey (dir: string) {
    // TODO: use Shawn's code generate key
    const nodekey = ethers.Wallet.createRandom()
    const privateKey = nodekey.privateKey.replace(/^0x/, '')
    const publicKey = nodekey.signingKey.publicKey.replace(/^0x04/, '')
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
  private async checkPeerCount (networkType: NetworkType, node: string) {
    let tryTime = 0
    let peerCount = 0
    do {
      peerCount = networkType === NetworkType.QUORUM ? parseInt(await this.quorumCommand('net.peerCount', node)) : Number(JSON.parse(await this.besuCommand('net_peerCount', node, '[""]')))
      if (tryTime !== 10) {
        tryTime += 1
        await sleep(500)
      } else {
        throw new TimeLimitError('[x] Time limit reached. Please check later.')
      }
    } while (peerCount < 1)
  }

  /** @ignore */
  private async besuIsValidator (address: string, retryTime = 10) {
    let tryTime = 0
    let isValidator = false
    let validators
    do {
      validators = JSON.parse(await this.besuCommand('qbft_getValidatorsByBlockNumber', 'validator0', '["latest"]'))
      if (validators.includes(`0x${address}`)) {
        isValidator = true
      }
      if (tryTime !== retryTime) {
        const provider = new JsonRpcProvider('http://localhost:8545')
        const wallet = ethers.Wallet.createRandom().connect(provider)
        const tx = {
          to: '0x0000000000000000000000000000000000000000',
          value: '0x0',
          nonce: await provider.getTransactionCount(wallet.getAddress(), 'latest'),
        }
        const receipt = await wallet.sendTransaction(tx)
        await receipt.wait()

        tryTime += 1
        await sleep(500)
      } else {
        throw new TimeLimitError('[x] Time limit reached. Please check later.')
      }
    } while (isValidator === false)
  }

  /** @ignore */
  private async istanbulIsValidator (joinNode: string, retryTime = 10) {
    let tryTime = 0
    while (await this.quorumCommand('istanbul.isValidator()', `${joinNode}`) !== 'true') {
      if (tryTime !== retryTime) {
        const provider = new JsonRpcProvider('http://localhost:8545')
        const wallet = ethers.Wallet.createRandom().connect(provider)
        const tx = {
          to: '0x0000000000000000000000000000000000000000',
          value: '0x0',
          nonce: await provider.getTransactionCount(wallet.getAddress(), 'latest'),
        }
        const receipt = await wallet.sendTransaction(tx)
        await receipt.wait()

        tryTime += 1
        await sleep(500)
      } else {
        throw new TimeLimitError('[x] Time limit reached. Please check later.')
      }
    }
  }

  /** @ignore */
  public createBdkFolder () {
    return this.bdkFile.createBdkFolder()
  }

  /** @ignore */
  public getBdkFiles () {
    return this.bdkFile.getExportFiles()
  }

  /** @ignore */
  public getNetworkFiles () {
    const networkFilesList = this.bdkFile.getExportFiles().filter(
      file => file.match(/(validator|member|artifacts|network-info|contract)+/g),
    )
    return networkFilesList
  }

  /** @ignore */
  public getUpExportItems () {
    const node = this.bdkFile.getExportFiles().filter(file => file.match(/(validator|member)[0-9]+/g))
    const nodeList = node.map(x => ({ title: x, value: x }))
    return nodeList
  }

  /** @ignore */
  public removeBdkFiles (files: string[]) {
    for (const file of files) {
      this.bdkFile.removeBdkFiles(file)
    }
  }
}
