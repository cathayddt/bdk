import { ethers } from 'ethers'
import RLP from 'rlp'
import { NetworkCreateType, GenesisJsonType } from '../model/type/network.type'
import { AbstractService } from './Service.abstract'
import ValidatorInstance from '../instance/validator'
import ValidatorDockerComposeYaml from '../model/yaml/docker-compose/validatorDockerComposeYaml'
import MemberDockerComposeYaml from '../model/yaml/docker-compose/memberDockerCompose'
import MemberInstance from '../instance/member'
import { DockerResultType } from '../instance/infra/InfraRunner.interface'
import { TimeLimitError } from '../../util/error'
import { sleep } from '../../util/utils'

export default class Network extends AbstractService {
  /**
   * @description 建立 quorum network
   */
  public async create (networkCreateConfig: NetworkCreateType) {
    const validatorAddressList: Buffer[] = []
    for (let i = 0; i < networkCreateConfig.validatorNumber; i++) {
      const { address } = this.createKey(`artifacts/validator${i}`)
      validatorAddressList.push(Buffer.from(address, 'hex'))
    }
    for (let i = 0; i < networkCreateConfig.memberNumber; i++) {
      this.createKey(`artifacts/member${i}`)
    }

    const extraDataContent = [new Uint8Array(32), validatorAddressList, [], null, []]
    const extraDataCoded = RLP.encode(extraDataContent)
    const extraData = '0x' + Buffer.from(extraDataCoded).toString('hex')

    const alloc: {[address: string]: {balance: string}} = {}
    networkCreateConfig.alloc.forEach(x => {
      alloc[`0x${x.account.replace(/^0x/, '').toLowerCase()}`] = { balance: x.amount }
    })

    const genesisJson: GenesisJsonType = {
      nonce: '0x0',
      timestamp: `0x${Math.floor(Date.now() / 1000).toString(16)}`,
      extraData,
      gasLimit: '0xE0000000',
      gasUsed: '0x0',
      number: '0x0',
      difficulty: '0x1',
      coinbase: '0x0000000000000000000000000000000000000000',
      mixHash: '0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365',
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      config: {
        chainId: networkCreateConfig.chainId,
        homesteadBlock: 0,
        eip150Block: 0,
        eip150Hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        eip155Block: 0,
        eip158Block: 0,
        byzantiumBlock: 0,
        constantinopleBlock: 0,
        petersburgBlock: 0,
        istanbulBlock: 0,
        qbft: {
          epochLength: 30000,
          blockPeriodSeconds: 1,
          emptyBlockPeriodSeconds: 3600,
          requestTimeoutSeconds: 60,
          policy: 0,
          ceil2Nby3Block: 0,
        },
        transitions: [
          {
            block: 0,
            transactionSizeLimit: 64,
            contractSizeLimit: 64,
          },
        ],
        txnSizeLimit: 64,
        isQuorum: true,
      },
      alloc,
    }
    this.bdkFile.createArtifactsFolder()
    this.bdkFile.createGenesisJson(genesisJson)

    this.bdkFile.createDisallowedNodesJson([])
    const staticNodesJson = []
    const bdkPath = this.bdkFile.getBdkPath()

    for (let i = 0; i < networkCreateConfig.validatorNumber; i++) {
      const validatorPublicKey = this.bdkFile.getValidatorPublicKey(i)
      const validatorNode = `enode://${validatorPublicKey}@validator${i}:30303`
      staticNodesJson.push(validatorNode)
    }
    for (let i = 0; i < networkCreateConfig.memberNumber; i++) {
      const memberPublicKey = this.bdkFile.getMemberPublicKey(i)
      const memberNode = `enode://${memberPublicKey}@member${i}:30303`
      staticNodesJson.push(memberNode)
    }
    const validatorDockerComposeYaml = new ValidatorDockerComposeYaml()
    this.bdkFile.createStaticNodesJson(staticNodesJson)
    this.bdkFile.copyStaticNodesJsonToPermissionedNodesJson()
    for (let i = 0; i < networkCreateConfig.validatorNumber; i++) {
      this.bdkFile.copyGenesisJsonToValidator(i)
      this.bdkFile.copyStaticNodesJsonToValidator(i)
      this.bdkFile.copyPermissionedNodesJsonToValidator(i)

      this.bdkFile.copyPrivateKeyToValidator(i)
      this.bdkFile.copyPublicKeyToValidator(i)
      this.bdkFile.copyAddressToValidator(i)

      validatorDockerComposeYaml.addValidator(this.bdkFile.getBdkPath(), i, 8545 + i * 2)
    }
    this.bdkFile.createValidatorDockerComposeYaml(validatorDockerComposeYaml)

    await (new ValidatorInstance(this.config, this.infra).up())

    const memberDockerComposeYaml = new MemberDockerComposeYaml()
    for (let i = 0; i < networkCreateConfig.memberNumber; i++) {
      this.bdkFile.copyGenesisJsonToMember(i)
      this.bdkFile.copyStaticNodesJsonToMember(i)
      this.bdkFile.copyPermissionedNodesJsonToMember(i)

      this.bdkFile.copyPrivateKeyToMember(i)
      this.bdkFile.copyPublicKeyToMember(i)
      this.bdkFile.copyAddressToMember(i)

      memberDockerComposeYaml.addMember(bdkPath, i, 8645 + i * 2)
    }
    this.bdkFile.createMemberDockerComposeYaml(memberDockerComposeYaml)

    await (new MemberInstance(this.config, this.infra).up())
    // TODO: check quorum network create successfully
  }

  public async addValidatorLocal () {
    // count validator number
    const validatorCount = parseInt(await this.quorumCommand('istanbul.getValidators().length', 0))
    const validatorNum = validatorCount
    const { publicKey, address } = this.createKey(`artifacts/validator${validatorNum}`)
    const validatorNode = `enode://${publicKey}@validator${validatorNum}:30303`

    this.bdkFile.copyPrivateKeyToValidator(validatorNum)
    this.bdkFile.copyPublicKeyToValidator(validatorNum)
    this.bdkFile.copyAddressToValidator(validatorNum)

    for (let i = 0; i < validatorNum; i++) {
      await this.quorumCommand(`istanbul.propose("0x${address}", true)`, i)
    }

    this.bdkFile.copyGenesisJsonToValidator(validatorNum)

    // read & add new node to static-nodes.json
    const staticNodesJson = this.bdkFile.getStaticNodesJson()
    staticNodesJson.push(validatorNode)
    this.bdkFile.createStaticNodesJson(staticNodesJson)
    this.bdkFile.copyStaticNodesJsonToPermissionedNodesJson()

    // for loop to copy static-nodes.json to validator
    const validatorDockerComposeYaml = new ValidatorDockerComposeYaml()
    for (let i = 0; i < validatorNum + 1; i++) {
      this.bdkFile.copyStaticNodesJsonToValidator(i)
      this.bdkFile.copyPermissionedNodesJsonToValidator(i)
      validatorDockerComposeYaml.addValidator(this.bdkFile.getBdkPath(), i, 8545 + i * 2)
    }
    this.bdkFile.createValidatorDockerComposeYaml(validatorDockerComposeYaml)

    // for loop to copy static-nodes.json to member
    const memberCount = await this.bdkFile.getExportFiles().filter(file => file.match(/(member)[0-9]+/g)).length
    for (let i = 0; i < memberCount; i++) {
      this.bdkFile.copyStaticNodesJsonToMember(i)
      this.bdkFile.copyPermissionedNodesJsonToMember(i)
    }

    await (new ValidatorInstance(this.config, this.infra).upOneService(`validator${validatorNum}`))

    let tryTime = 0
    while (await this.quorumCommand('istanbul.isValidator()', validatorNum) !== 'true') {
      if (tryTime !== 10) {
        const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
        const wallet = ethers.Wallet.createRandom().connect(provider)
        const tx = {
          to: '0x0000000000000000000000000000000000000000',
          value: '0x0',
          nonce: provider.getTransactionCount(wallet.getAddress(), 'latest'),
        }
        const receipt = await wallet.sendTransaction(tx)
        await receipt.wait()

        tryTime += 1
        await sleep(500)
      } else {
        throw new TimeLimitError('[x] Time limit reached. Please check later.')
      }
    }
    return validatorNum
  }

  public async addMemberLocal () {
    // count member number
    const memberCount = (await this.bdkFile.getExportFiles().filter(file => file.match(/(member)[0-9]+/g))).length
    const memberNum = memberCount
    const { publicKey } = this.createKey(`artifacts/member${memberNum}`)
    const memberNode = `enode://${publicKey}@member${memberNum}:30303`

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
    const validatorCount = parseInt(await this.quorumCommand('istanbul.getValidators().length', 0))
    for (let i = 0; i < validatorCount; i++) {
      this.bdkFile.copyStaticNodesJsonToValidator(i)
      this.bdkFile.copyPermissionedNodesJsonToValidator(i)
    }

    // for loop to copy static-nodes.json to member
    const memberDockerComposeYaml = new MemberDockerComposeYaml()
    for (let i = 0; i < memberCount + 1; i++) {
      this.bdkFile.copyStaticNodesJsonToMember(i)
      this.bdkFile.copyPermissionedNodesJsonToMember(i)
      memberDockerComposeYaml.addMember(this.bdkFile.getBdkPath(), i, 8645 + i * 2)
    }
    this.bdkFile.createMemberDockerComposeYaml(memberDockerComposeYaml)

    await (new MemberInstance(this.config, this.infra).upOneService(`member${memberNum}`))

    let tryTime = 0
    while (parseInt(await this.quorumCommand('net.peerCount', memberNum, 'member')) < 1) {
      if (tryTime !== 10) {
        tryTime += 1
        await sleep(500)
      } else {
        throw new TimeLimitError('[x] Time limit reached. Please check later.')
      }
    }

    return memberNum
  }

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
  private async quorumCommand (args: string, i: number, option: string = 'validator') {
    const result = await this.infra.runCommand({
      autoRemove: true,
      user: false,
      image: 'quorumengineering/quorum',
      tag: '22.7.4',
      volumes: [`${this.bdkFile.getBdkPath()}/${option}${i}/data/geth.ipc:/root/geth.ipc`],
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
  public createWalletAddress () {
    // TODO: use Shawn's code generate key
    const nodekey = ethers.Wallet.createRandom()
    const privateKey = nodekey.privateKey.replace(/^0x/, '')
    const publicKey = nodekey.publicKey.replace(/^0x04/, '')
    const address = nodekey.address.replace(/^0x/, '').toLowerCase()

    return { privateKey, publicKey, address }
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
    const array = []
    array.push(this.bdkFile.getExportFiles().filter(file => file.match(/(validator|member)+/g)))
    array.push(this.bdkFile.getExportFiles().filter(file => file.match(/(artifacts)/g)))
    const networkFilesList = array.flat()

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
