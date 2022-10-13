import { ethers } from 'ethers'
// import * as fs from 'fs'
import RLP from 'rlp'
import { NetworkCreateType, GenesisJsonType } from '../model/type/network.type'
import { AbstractService } from './Service.abstract'

export default class Network extends AbstractService {
  /**
   * @description 建立 quorum network
   */
  public create (networkCreateConfig: NetworkCreateType) {
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
      gasLimit: '0xFFFFFF',
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
          emptyBlockPeriodSeconds: 60,
          requestTimeoutSeconds: 4,
          policy: 0,
          ceil2Nby3Block: 0,
        },
        txnSizeLimit: 64,
        maxCodeSize: 0,
        isQuorum: true,
      },
      alloc,
    }
    this.bdkFile.createArtifactsFolder()
    this.bdkFile.createGenesisJson(genesisJson)

    this.bdkFile.createDisallowedNodesJson([])
    const staticNodesJson = []

    for (let i = 0; i < networkCreateConfig.validatorNumber; i++) {
      const validatorPublicKey = this.bdkFile.getValidatorPublicKey(i)
      const validatorNode = `enode://${validatorPublicKey}@validator-${i}:30303`
      staticNodesJson.push(validatorNode)
    }

    for (let i = 0; i < networkCreateConfig.memberNumber; i++) {
      const memberPublicKey = this.bdkFile.getMemberPublicKey(i)
      const memberNode = `enode://${memberPublicKey}@member-${i}:30303`
      staticNodesJson.push(memberNode)
    }

    this.bdkFile.createStaticNodesJson(staticNodesJson)
    this.bdkFile.copyStaticNodesJsonToPermissionedNodesJson()

    for (let i = 0; i < networkCreateConfig.validatorNumber; i++) {
      this.bdkFile.copyGenesisJsonToValidator(i)
      this.bdkFile.copyStaticNodesJsonToValidator(i)
      this.bdkFile.copyPermissionedNodesJsonToValidator(i)

      this.bdkFile.copyPrivateKeyToValidator(i)
      this.bdkFile.copyPublicKeyToValidator(i)
      this.bdkFile.copyAddressToValidator(i)

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
    }

    for (let i = 0; i < networkCreateConfig.memberNumber; i++) {
      this.bdkFile.copyGenesisJsonToMember(i)
      this.bdkFile.copyStaticNodesJsonToMember(i)
      this.bdkFile.copyPermissionedNodesJsonToMember(i)

      this.bdkFile.copyPrivateKeyToMember(i)
      this.bdkFile.copyPublicKeyToMember(i)
      this.bdkFile.copyAddressToMember(i)

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
    }
  }

  // # docker run --rm -it -v $PWD/Validator-0/data/geth.ipc:/root/geth.ipc quorumengineering/quorum:22.7.0 attach /root/geth.ipc --exec "net.peerCount"
  // # docker run --rm -it -v $PWD/Validator-0/data/geth.ipc:/root/geth.ipc quorumengineering/quorum:22.7.0 attach /root/geth.ipc --exec "istanbul.getValidators(\"latest\")"
  // # docker run --rm -it -v $PWD/Validator-0/data/geth.ipc:/root/geth.ipc quorumengineering/quorum:22.7.0 attach /root/geth.ipc --exec "eth.blockNumber"

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
}
