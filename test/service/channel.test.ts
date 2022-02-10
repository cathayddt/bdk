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
})
