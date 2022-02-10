/* global describe, it, before, after */
import fs from 'fs'
import assert from 'assert'
import sinon from 'sinon'
import config from '../../src/config'
import { NetworkCreateType } from '../../src/model/type/network.type'
import Channel from '../../src/service/channel'
import { PolicyTypeEnum } from '../../src/model/type/channel.type'
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
        channelName: 'test-channel',
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
})
