// /* global describe, it, before, after, beforeEach, afterEach */
// import fs from 'fs'
// import Config from '../../src/service/config'
// import Peer from '../../src/service/peer'
// import Network from '../../src/service/network'
// import Orderer from '../../src/service/orderer'
// import Channel from '../../src/service/channel'
// import Org from '../../src/service/org'
// import { NetworkCreateDto } from '../../src/model/type/network.dto'
// import { CreateChannelDto, JoinChannelDto, UpdateAnchorPeerDto } from '../../src/model/type/channel.dto'
// import { PeerOrgNameAndDomain } from '../../src/model/type/org.dto'
// import Dockerode from 'dockerode'
// import sinon from 'sinon'
// import config from '../../src/config'
// import cleanSpace from '../util/cleanSpace'
// import { time } from 'console'
// import { configstub } from '../util/configStub'

// describe('Org service:', function () {
//   this.timeout(20000)
//   const docker: Dockerode = new Dockerode({ socketPath: '/var/run/docker.sock' })
//   const dockerdOption = { all: true }

//   const networkCreateDto: NetworkCreateDto = JSON.parse(fs.readFileSync('test/sample/network-create.json').toString())
//   const channelCreateDto: CreateChannelDto = JSON.parse(fs.readFileSync('test/sample/channel-create.json').toString())

//   const peerOrgs = networkCreateDto.peerOrgs
//   const ordererOrgs = networkCreateDto.ordererOrgs

//   const peerOrgNames: string[] = []
//   for (const peerOrg of peerOrgs) {
//     for (let i = 0; i < peerOrg.peerCount; i++) {
//       peerOrgNames.push(`peer${i}.${peerOrg.domain}`)
//     }
//   }
//   const ordererOrgNames: string[] = []
//   for (const ordererOrg of ordererOrgs) {
//     ordererOrgNames.push(`${ordererOrg.hostname}.${ordererOrg.domain}`)
//   }
//   const processOrdererOrg: string = ordererOrgs[0].name + '.' + ordererOrgs[0].domain

//   const joinChannelDto: JoinChannelDto = {
//     channelName: channelCreateDto.channelName,
//     orderer: processOrdererOrg,
//   }

//   const updateAnchorPeerDto: UpdateAnchorPeerDto = {
//     channelName: channelCreateDto.channelName,
//     orderer: processOrdererOrg,
//   }

//   const newOrg: PeerOrgNameAndDomain = {
//     orgName: 'Selina',
//     domain: 'selina.cathaybc.com',
//   }

//   before(async function () {
//     // runs once before the first test in this block
//     await cleanSpace(docker)

//     configstub.callsFake(function ({ key, value }): void{
//       // makesure Config set modified process configuration
//       const newenv = { [key]: value }
//       config.orgName = newenv.BDK_ORG_NAME || ''
//       config.orgDomainName = newenv.BDK_ORG_DOMAIN || ''
//     })

//     Config.init()
//     await Network.createFull(networkCreateDto)
//     await Peer.up(peerOrgNames)
//     await Orderer.up(ordererOrgNames)
//     await new Promise(resolve => { setTimeout(resolve, 1000) })

//     await Channel.create(channelCreateDto)

//     for (const peerOrg of peerOrgs) {
//       Config.set({ key: 'BDK_ORG_NAME', value: peerOrg.name })
//       Config.set({ key: 'BDK_ORG_DOMAIN', value: peerOrg.domain })
//       await Channel.join(joinChannelDto)
//       await Channel.updateAnchorPeer(updateAnchorPeerDto)
//     }
//   })

//   after(async function () {
//     // runs once after the last test in this block
//     configstub.restore()
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//     await cleanSpace(docker)
//     await new Promise(resolve => setTimeout(resolve, 1000))
//   })

//   beforeEach(function () {
//     // runs before each test in this block
//   })

//   afterEach(function () {
//     // runs after each test in this block
//   })

//   it('[Org.peerAdd]', function () {
//     const stub = sinon.stub(Peer, 'addChannel')
//     Org.peerAdd(processOrdererOrg, channelCreateDto.channelName, [newOrg])
//     sinon.assert.calledOnceWithExactly(stub, processOrdererOrg, channelCreateDto.channelName, 'Selina')
//     stub.restore()
//   })
// })
