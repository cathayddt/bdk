/* global describe, it, before, after, beforeEach, afterEach */
import fs from 'fs'
import assert from 'assert'
import sinon from 'sinon'
import config from '../../src/config'
import { NetworkCreateType } from '../../src/model/type/network.type'
import Channel from '../../src/service/channel'
import { ChannelConfigEnum, PolicyTypeEnum } from '../../src/model/type/channel.type'
import MinimumNetwork from '../util/minimumNetwork'
import { DockerResultType } from '../../src/instance/infra/InfraRunner.interface'

describe('Channel service:', function () {
  this.timeout(60000)

  let minimumNetwork: MinimumNetwork
  let networkCreateJson: NetworkCreateType
  let channelService: Channel
  let channelServiceOrg0Peer: Channel

  before(() => {
    minimumNetwork = new MinimumNetwork()
    networkCreateJson = JSON.parse(fs.readFileSync('./cicd/test_script/network-create-min.json').toString())
    channelService = new Channel(config)
    channelServiceOrg0Peer = new Channel(minimumNetwork.org0PeerConfig)
  })

  describe('create', () => {
    it('should use createSteps', async () => {
      const channelCreateStepCreateChannelArtifactStub = sinon.stub().resolves()
      const channelCreateStepCreateOnInstanceStub = sinon.stub().resolves()
      const channelCreateStepsStub = sinon.stub(Channel.prototype, 'createSteps').callsFake(() => ({
        createChannelArtifact: channelCreateStepCreateChannelArtifactStub,
        createOnInstance: channelCreateStepCreateOnInstanceStub,
      }))
      await channelService.create({
        channelName: minimumNetwork.channelName,
        orgNames: [networkCreateJson.peerOrgs[0].name],
        channelAdminPolicy: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Admins' },
        lifecycleEndorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
        endorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
        orderer: minimumNetwork.getOrderer().fullUrl,
      })
      assert.deepStrictEqual(channelCreateStepCreateChannelArtifactStub.called, true)
      assert.deepStrictEqual(channelCreateStepCreateOnInstanceStub.called, true)
      channelCreateStepsStub.restore()
    })
  })

  describe('createSteps', () => {
    let channelName: string

    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      channelName = minimumNetwork.channelName
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('createChannelArtifact', () => {
      it('should create channel artifact', async () => {
        await channelService.createSteps().createChannelArtifact({
          channelName,
          orgNames: [minimumNetwork.getPeer().orgName],
          channelAdminPolicy: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Admins' },
          lifecycleEndorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
          endorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
          orderer: minimumNetwork.getOrderer().fullUrl,
        })
        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}/${channelName}.tx`), true)
      })
    })

    describe('createOnInstance', () => {
      before(async () => {
        await channelServiceOrg0Peer.createSteps().createChannelArtifact({
          channelName,
          orgNames: [minimumNetwork.getPeer().orgName],
          channelAdminPolicy: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Admins' },
          lifecycleEndorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
          endorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
          orderer: minimumNetwork.getOrderer().fullUrl,
        })
      })

      it('should create channel on instance', async () => {
        await channelServiceOrg0Peer.createSteps().createOnInstance({
          channelName,
          orgNames: [minimumNetwork.getPeer().orgName],
          channelAdminPolicy: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Admins' },
          lifecycleEndorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
          endorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
          orderer: minimumNetwork.getOrderer().fullUrl,
        })
        assert.deepStrictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}/${channelName}.block`), true)
      })
    })
  })

  describe('join', () => {
    it('should use joinSteps', async () => {
      const channelJoinStepFetchChannelBlockStub = sinon.stub().resolves()
      const channelJoinStepJoinOnInstanceStub = sinon.stub().resolves()
      const channelJoinStepsStub = sinon.stub(Channel.prototype, 'joinSteps').callsFake(() => ({
        fetchChannelBlock: channelJoinStepFetchChannelBlockStub,
        joinOnInstance: channelJoinStepJoinOnInstanceStub,
      }))
      await channelService.join({
        channelName: minimumNetwork.channelName,
        orderer: minimumNetwork.getOrderer().fullUrl,
      })
      assert.deepStrictEqual(channelJoinStepFetchChannelBlockStub.called, true)
      assert.deepStrictEqual(channelJoinStepJoinOnInstanceStub.called, true)
      channelJoinStepsStub.restore()
    })
  })

  describe('joinSteps', () => {
    let channelName: string

    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      channelName = minimumNetwork.channelName
      await channelServiceOrg0Peer.create({
        channelName,
        orgNames: [networkCreateJson.peerOrgs[0].name],
        channelAdminPolicy: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Admins' },
        lifecycleEndorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
        endorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
        orderer: minimumNetwork.getOrderer().fullUrl,
      })
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('fetchChannelBlock', () => {
      it('should fetch channel block', async () => {
        await channelServiceOrg0Peer.joinSteps().fetchChannelBlock({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
        })
        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}/${channelName}.tx`), true)
      })
    })

    describe('joinOnInstance', () => {
      before(async () => {
        await channelServiceOrg0Peer.joinSteps().fetchChannelBlock({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
        })
      })

      it('should join channel on instance', async () => {
        await channelServiceOrg0Peer.joinSteps().joinOnInstance({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
        })
        assert.deepStrictEqual(Channel.parser.listJoinedChannel((await channelServiceOrg0Peer.listJoinedChannel() as DockerResultType)), [minimumNetwork.channelName])
      })
    })
  })

  describe('updateAnchorPeer', () => {
    it('should use updateAnchorPeerSteps', async () => {
      const channelUpdateAnchorPeerStepFetchChannelBlockStub = sinon.stub().resolves()
      const channelUpdateAnchorPeerStepComputeUpdateConfigTxStub = sinon.stub().resolves()
      const channelUpdateAnchorPeerStepSignConfigTxStub = sinon.stub().resolves()
      const channelUpdateAnchorPeerStepUpdateChannelConfigStub = sinon.stub().resolves()
      const channelUpdateAnchorPeerStepsStub = sinon.stub(Channel.prototype, 'updateAnchorPeerSteps').callsFake(() => ({
        fetchChannelConfig: channelUpdateAnchorPeerStepFetchChannelBlockStub,
        computeUpdateConfigTx: channelUpdateAnchorPeerStepComputeUpdateConfigTxStub,
        signConfigTx: channelUpdateAnchorPeerStepSignConfigTxStub,
        updateChannelConfig: channelUpdateAnchorPeerStepUpdateChannelConfigStub,
      }))
      await channelService.updateAnchorPeer({
        channelName: minimumNetwork.channelName,
        orderer: minimumNetwork.getOrderer().fullUrl,
        port: minimumNetwork.getPeer().port,
      })
      assert.deepStrictEqual(channelUpdateAnchorPeerStepFetchChannelBlockStub.called, true)
      assert.deepStrictEqual(channelUpdateAnchorPeerStepComputeUpdateConfigTxStub.called, true)
      assert.deepStrictEqual(channelUpdateAnchorPeerStepSignConfigTxStub.called, true)
      assert.deepStrictEqual(channelUpdateAnchorPeerStepUpdateChannelConfigStub.called, true)
      channelUpdateAnchorPeerStepsStub.restore()
    })
  })

  describe('updateAnchorPeerSteps', () => {
    let channelName: string
    let channelPath: string

    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      channelName = minimumNetwork.channelName
      channelPath = `${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}`
      await channelServiceOrg0Peer.create({
        channelName,
        orgNames: [networkCreateJson.peerOrgs[0].name],
        channelAdminPolicy: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Admins' },
        lifecycleEndorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
        endorsement: { type: PolicyTypeEnum.IMPLICITMETA, value: 'ANY Endorsement' },
        orderer: minimumNetwork.getOrderer().fullUrl,
      })
      await channelServiceOrg0Peer.join({
        channelName,
        orderer: minimumNetwork.getOrderer().fullUrl,
      })
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('fetchChannelConfig', () => {
      it('should fetch channel config', async () => {
        await channelServiceOrg0Peer.updateAnchorPeerSteps().fetchChannelConfig({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          port: minimumNetwork.getPeer().port,
        })
        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_fetch.pb`), true)
      })
    })

    describe('computeUpdateConfigTx', () => {
      before(async () => {
        await channelServiceOrg0Peer.updateAnchorPeerSteps().fetchChannelConfig({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          port: minimumNetwork.getPeer().port,
        })
      })

      it('should compute config diff', async () => {
        await channelServiceOrg0Peer.updateAnchorPeerSteps().computeUpdateConfigTx({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          port: minimumNetwork.getPeer().port,
        })
        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_update_envelope.pb`), true)
      })
    })

    describe('signConfigTx', () => {
      before(async () => {
        await channelServiceOrg0Peer.updateAnchorPeerSteps().fetchChannelConfig({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          port: minimumNetwork.getPeer().port,
        })
        await channelServiceOrg0Peer.updateAnchorPeerSteps().computeUpdateConfigTx({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          port: minimumNetwork.getPeer().port,
        })
      })

      it('should sign envelop', async () => {
        await channelServiceOrg0Peer.updateAnchorPeerSteps().signConfigTx({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          port: minimumNetwork.getPeer().port,
        })
        const envelope = await channelService.decodeEnvelope({ channelName })
        assert.deepStrictEqual(envelope.approved, [minimumNetwork.getPeer().orgName])
      })
    })

    describe('updateChannelConfig', () => {
      before(async () => {
        await channelServiceOrg0Peer.updateAnchorPeerSteps().fetchChannelConfig({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          port: minimumNetwork.getPeer().port,
        })
        await channelServiceOrg0Peer.updateAnchorPeerSteps().computeUpdateConfigTx({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          port: minimumNetwork.getPeer().port,
        })
        await channelServiceOrg0Peer.updateAnchorPeerSteps().signConfigTx({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          port: minimumNetwork.getPeer().port,
        })
      })

      it('should update channel config', async () => {
        await channelServiceOrg0Peer.updateAnchorPeerSteps().updateChannelConfig({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          port: minimumNetwork.getPeer().port,
        })
        assert.deepStrictEqual((await channelServiceOrg0Peer.getChannelGroup(channelName)).anchorPeer, [`${minimumNetwork.getPeer().hostname}.${minimumNetwork.getPeer().orgDomain}:${minimumNetwork.getPeer().port}`])
      })
    })
  })

  describe('fetchChannelBlock', () => {
    describe('should use correct fetchChannelBlockSteps', () => {
      let channelFetchChannelBlockStepFetchChannelNewestBlockStub: sinon.SinonStub
      let channelFetchChannelBlockStepFetchChannelGenesisBlockStub: sinon.SinonStub
      let channelFetchChannelBlockStepFetchChannelConfigStub: sinon.SinonStub
      let channelUpdateAnchorPeerStepsStub: sinon.SinonStub

      beforeEach(() => {
        channelFetchChannelBlockStepFetchChannelNewestBlockStub = sinon.stub().resolves()
        channelFetchChannelBlockStepFetchChannelGenesisBlockStub = sinon.stub().resolves()
        channelFetchChannelBlockStepFetchChannelConfigStub = sinon.stub().resolves()
        channelUpdateAnchorPeerStepsStub = sinon.stub(Channel.prototype, 'fetchChannelBlockSteps').callsFake(() => ({
          fetchChannelNewestBlock: channelFetchChannelBlockStepFetchChannelNewestBlockStub,
          fetchChannelGenesisBlock: channelFetchChannelBlockStepFetchChannelGenesisBlockStub,
          fetchChannelConfig: channelFetchChannelBlockStepFetchChannelConfigStub,
        }))
      })

      afterEach(() => {
        channelUpdateAnchorPeerStepsStub.restore()
      })

      it('ChannelConfigEnum.LATEST_BLOCK', async () => {
        await channelService.fetchChannelBlock({
          channelName: minimumNetwork.channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          configType: ChannelConfigEnum.LATEST_BLOCK,
          outputFileName: 'latest-block',
        })
        assert.deepStrictEqual(channelFetchChannelBlockStepFetchChannelNewestBlockStub.called, true)
        assert.deepStrictEqual(channelFetchChannelBlockStepFetchChannelGenesisBlockStub.called, false)
        assert.deepStrictEqual(channelFetchChannelBlockStepFetchChannelConfigStub.called, false)
      })

      it('ChannelConfigEnum.GENESIS_BLOCK', async () => {
        await channelService.fetchChannelBlock({
          channelName: minimumNetwork.channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          configType: ChannelConfigEnum.GENESIS_BLOCK,
          outputFileName: 'genesis-block',
        })
        assert.deepStrictEqual(channelFetchChannelBlockStepFetchChannelNewestBlockStub.called, false)
        assert.deepStrictEqual(channelFetchChannelBlockStepFetchChannelGenesisBlockStub.called, true)
        assert.deepStrictEqual(channelFetchChannelBlockStepFetchChannelConfigStub.called, false)
      })

      it('ChannelConfigEnum.CONFIG_BLOCK', async () => {
        await channelService.fetchChannelBlock({
          channelName: minimumNetwork.channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          configType: ChannelConfigEnum.CONFIG_BLOCK,
          outputFileName: 'config-block',
        })
        assert.deepStrictEqual(channelFetchChannelBlockStepFetchChannelNewestBlockStub.called, false)
        assert.deepStrictEqual(channelFetchChannelBlockStepFetchChannelGenesisBlockStub.called, false)
        assert.deepStrictEqual(channelFetchChannelBlockStepFetchChannelConfigStub.called, true)
      })
    })
  })

  describe('fetchChannelBlockSteps', () => {
    let channelName: string

    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      channelName = minimumNetwork.channelName
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('fetchChannelNewestBlock', () => {
      it('should fetch channel newest block', async () => {
        await channelServiceOrg0Peer.fetchChannelBlockSteps().fetchChannelNewestBlock({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          configType: ChannelConfigEnum.LATEST_BLOCK,
          outputFileName: 'latest-block',
        })
        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}/latest-block.block`), true)
      })
    })

    describe('fetchChannelGenesisBlock', () => {
      it('should fetch channel genesis block', async () => {
        await channelServiceOrg0Peer.fetchChannelBlockSteps().fetchChannelGenesisBlock({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          configType: ChannelConfigEnum.GENESIS_BLOCK,
          outputFileName: 'genesis-block',
        })
        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}/genesis-block.block`), true)
      })
    })

    describe('fetchChannelConfig', () => {
      it('should fetch channel config', async () => {
        await channelServiceOrg0Peer.fetchChannelBlockSteps().fetchChannelConfig({
          channelName,
          orderer: minimumNetwork.getOrderer().fullUrl,
          configType: ChannelConfigEnum.CONFIG_BLOCK,
          outputFileName: 'config-block',
        })
        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}/config-block.block`), true)
      })
    })
  })

  describe('getChannelGroup', () => {
    it('should use getChannelGroupSteps', async () => {
      const channelGetChannelGroupStepFetchChannelConfigStub = sinon.stub().resolves()
      const channelGetChannelGroupStepDecodeFetchedChannelConfigStub = sinon.stub().resolves()
      const channelGetChannelGroupStepsStub = sinon.stub(Channel.prototype, 'getChannelGroupSteps').callsFake(() => ({
        fetchChannelConfig: channelGetChannelGroupStepFetchChannelConfigStub,
        decodeFetchedChannelConfig: channelGetChannelGroupStepDecodeFetchedChannelConfigStub,
      }))
      await channelService.getChannelGroup(minimumNetwork.channelName)
      assert.deepStrictEqual(channelGetChannelGroupStepFetchChannelConfigStub.called, true)
      assert.deepStrictEqual(channelGetChannelGroupStepDecodeFetchedChannelConfigStub.called, true)
      channelGetChannelGroupStepsStub.restore()
    })
  })

  describe('getChannelGroupSteps', () => {
    let channelName: string
    let channelPath: string
    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      channelName = minimumNetwork.channelName
      channelPath = `${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}`
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    describe('fetchChannelConfig', () => {
      it('should fetch channel config', async () => {
        await channelServiceOrg0Peer.getChannelGroupSteps().fetchChannelConfig(channelName)
        assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_fetch.pb`), true)
      })
    })

    describe('decodeFetchedChannelConfig', () => {
      before(async () => {
        await channelServiceOrg0Peer.getChannelGroupSteps().fetchChannelConfig(channelName)
      })

      it('should decode fetched channel config', async () => {
        const decodeResult = await channelServiceOrg0Peer.getChannelGroupSteps().decodeFetchedChannelConfig(channelName)
        assert.deepStrictEqual(decodeResult, {
          anchorPeer: [`${minimumNetwork.getPeer().hostname}.${minimumNetwork.getPeer().orgDomain}:${minimumNetwork.getPeer().port}`],
          orderer: [minimumNetwork.getOrderer().fullUrl],
        })
      })
    })
  })

  describe('fetchChannelConfig', () => {
    let channelName: string
    let channelPath: string
    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      channelName = minimumNetwork.channelName
      channelPath = `${config.infraConfig.bdkPath}/${config.networkName}/channel-artifacts/${channelName}`
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    it('should fetch channel config', async () => {
      await channelServiceOrg0Peer.fetchChannelConfig(channelName)
      assert.strictEqual(fs.existsSync(`${channelPath}/${channelName}_fetch.pb`), true)
    })
  })

  describe('getConfigBlock', () => {
    let channelName: string
    before(async () => {
      await minimumNetwork.createNetwork()
      await minimumNetwork.peerAndOrdererUp()
      await minimumNetwork.createChannelAndJoin()
      channelName = minimumNetwork.channelName
      await channelServiceOrg0Peer.fetchChannelConfig(channelName)
    })

    after(async () => {
      await minimumNetwork.deleteNetwork()
    })

    it('should get channel config', async () => {
      const result = await channelServiceOrg0Peer.getConfigBlock(channelName)
      assert.deepStrictEqual(Object.keys(result).includes('channel_group'), true)
    })
  })

  describe('channelConfigFileName', () => {
    it('should get filename of channel config', () => {
      assert.deepStrictEqual(Channel.channelConfigFileName('test-channel'), {
        compareUpdatedConfigFileName: 'test-channel_config_update',
        envelopeFileName: 'test-channel_update_envelope',
        fetchFileName: 'test-channel_fetch',
        modifiedFileName: 'test-channel_modified_config_block',
        originalFileName: 'test-channel_config_block',
      })
    })
  })
})
