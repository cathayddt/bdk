// /* global describe, it, before, after, beforeEach, afterEach */
// import fs from 'fs'
// import assert from 'assert'
// import config from '../../src/config'
// import { NetworkCreateDto } from '../../src/model/type/network.dto'
// import { ConfigtxlatorEnum, CreateChannelDto, JoinChannelDto, UpdateAnchorPeerDto } from '../../src/model/type/channel.dto'
// import network from '../../src/service/network'
// import peer from '../../src/service/peer'
// import orderer from '../../src/service/orderer'
// import channel from '../../src/service/channel'
// import Config from '../../src/service/config'
// import Dockerode from 'dockerode'
// import sinon from 'sinon'
// import cleanSpace from '../util/cleanSpace'
// import FabricTools from '../../src/instance/fabricTools'
// import { configstub } from '../util/configStub'

// describe('Channel service:', function () {
//   // this.slow(300000); // five minutes
//   this.timeout(60000)

//   const networkCreateDto: NetworkCreateDto = JSON.parse(fs.readFileSync('test/sample/network-create.json').toString())
//   const docker: Dockerode = new Dockerode({ socketPath: '/var/run/docker.sock' })
//   before(async function () {
//     // runs once before the first test in this block
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//     await cleanSpace(docker)
//     await new Promise(resolve => { setTimeout(resolve, 1000) })
//     configstub.callsFake(function ({ key, value }): void{
//       // makesure Config set modified process configuration
//       // const newenv = { [key]: value }
//       if (key === 'BDK_ORG_NAME') config.orgName = value
//       if (key === 'BDK_ORG_DOMAIN') config.orgDomainName = value
//       if (key === 'BDK_ORG_HOSTNAME') config.peerHostname = value
//     })

//     Config.init()
//     Config.set({ key: 'BDK_ORG_HOSTNAME', value: 'peer0' })
//     Config.set({ key: 'BDK_ORG_NAME', value: networkCreateDto.peerOrgs[0].name })
//     Config.set({ key: 'BDK_ORG_DOMAIN', value: networkCreateDto.peerOrgs[0].domain })

//     await network.createFull(networkCreateDto)
//     await orderer.up(networkCreateDto.ordererOrgs.reduce((hostnames: string[], ordererorg) => {
//       return hostnames.concat(ordererorg.hostname.map(host => `${host}.${ordererorg.domain}`))
//     }, []))

//     await peer.up(networkCreateDto.peerOrgs.reduce((peerhostnames: string[], peerorg) => {
//       let peerhostname: string[] = []
//       for (let i = 0; i < peerorg.peerCount; i++) {
//         peerhostname = [...peerhostname, `peer${i}.${peerorg.domain}`]
//       }
//       return [...peerhostnames, ...peerhostname]
//     }, []))
//     await new Promise(resolve => { setTimeout(resolve, 1000) })
//   })
//   after(async function () {
//     configstub.restore()
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//     await cleanSpace(docker)
//     await new Promise(resolve => { setTimeout(resolve, 1000) })
//     // runs once after the last test in this block
//   })
//   afterEach(function () {
//     // runs after each test in this block
//   })

//   beforeEach(function () {
//     // runs before each test in this block
//   })

//   const channelCreateDto: CreateChannelDto = JSON.parse(fs.readFileSync('test/sample/channel-create.json').toString())
//   const channelJoinDto: JoinChannelDto = { channelName: channelCreateDto.channelName, orderer: channelCreateDto.orderer }
//   const channelUpdateAnchorPeerDto: UpdateAnchorPeerDto = { channelName: channelCreateDto.channelName, orderer: channelCreateDto.orderer }
//   describe('Channel create and join:', function () {
//     it('[Channel.create]', async function () {
//       await channel.create(channelCreateDto)
//     })
//     const wantChannelGroup: { anchorPeer: string[]; orderer: string[] } = {
//       anchorPeer: [],
//       orderer: [
//         'orderer0.ben.cathaybc.com:7050',
//         'orderer1.ben.cathaybc.com:7150',
//         'orderer0.grace.cathaybc.com:7250',
//       ],
//     }
//     channelCreateDto.orgNames.map((orgName) => {
//       describe(`Channel join and update: ${orgName}`, function () {
//         before(function () {
//           Config.set({ key: 'BDK_ORG_NAME', value: orgName })
//           Config.set({ key: 'BDK_ORG_DOMAIN', value: networkCreateDto.peerOrgs.filter(x => x.name === orgName)[0].domain })
//         })
//         it('[Channel.join]', async function () {
//           await channel.join(channelJoinDto)
//         })
//         it('[Channel.updateAnchorPeer]', async function () {
//           await channel.updateAnchorPeer(channelUpdateAnchorPeerDto)
//         })
//         it('[Channel.getChannelGroup]', async function () {
//           await new Promise(resolve => { setTimeout(resolve, 1000) })
//           const get: { anchorPeer: string[]; orderer: string[] } = await channel.getChannelGroup(channelCreateDto.channelName)

//           const newanchorpeer = networkCreateDto.peerOrgs.filter(x => x.name === orgName).map(x => x.ports?.map(y => `${x.domain}:${y.port}`))[0]
//           assert(newanchorpeer)
//           wantChannelGroup.anchorPeer = wantChannelGroup.anchorPeer.concat(newanchorpeer)
//           assert.deepStrictEqual(get, wantChannelGroup, 'get wrong channel info')
//         })
//       })
//     })
//   })
//   describe('Channel Add org', function () {
//     // TODO
//     // Add org to channel and get channel Group
//   })
//   describe('Channel config ', function () {
//     const newOrgname = 'Liam'
//     before(async function () {
//       fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//       await cleanSpace(docker)
//       await new Promise(resolve => { setTimeout(resolve, 1000) })
//     })
//     after(async function () {
//       fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//       await cleanSpace(docker)
//       await new Promise(resolve => { setTimeout(resolve, 1000) })
//     })
//     it('[Channel.createNewOrgConfigTx]', async function () {
//       const FabricToolStub = sinon.stub(FabricTools, 'createNewOrgConfigTx')
//       FabricToolStub.returns(Promise.resolve('returnorgobj'))
//       await channel.createNewOrgConfigTx(newOrgname)
//       FabricToolStub.calledOnceWithExactly(newOrgname)
//       FabricToolStub.restore()
//       const files_should_exist = [
//         `org-json/${newOrgname}.json`,
//       ]
//       files_should_exist.forEach(filename => {
//         assert(fs.existsSync(`${config.infraConfig.hostPath}/${config.networkName}/${filename}`), `config file "${filename}" not exist`)
//       })
//     })
//     it('[Channel.fetchAndDecodeChannelConfig]', async function () {
//       const FabricToolStub1 = sinon.stub(FabricTools, 'fetchChannelConfigPb')
//       const FabricToolStub2 = sinon.stub(FabricTools, 'decodeProto')
//       FabricToolStub1.returns(Promise.resolve())
//       FabricToolStub2.returns(Promise.resolve())

//       await channel.fetchAndDecodeChannelConfig(channelCreateDto.orderer, channelCreateDto.channelName, 'BenOrderer', 'system_config_block', 'orderer', 'system_temp')

//       FabricToolStub1.calledOnceWithExactly(channelCreateDto.orderer, channelCreateDto.channelName, 'system_config_block', 'orderer', 'BenOrderer')
//       FabricToolStub2.calledOnceWithExactly(ConfigtxlatorEnum.BLOCK, channelCreateDto.channelName, 'system_config_block', 'system_temp')
//       FabricToolStub1.restore()
//       FabricToolStub2.restore()
//     })
//     // it('[Channel.createChannelConfigUpdate]', async function () {

//     // })
//   })
// })
