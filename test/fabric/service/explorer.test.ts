// /* global describe, it, before, after, beforeEach, afterEach */
// import fs from 'fs'
// import assert from 'assert'
// import Config from '../../src/service/config'
// import Peer from '../../src/service/peer'
// import Network from '../../src/service/network'
// import Orderer from '../../src/service/orderer'
// import Channel from '../../src/service/channel'
// import Explorer from '../../src/service/explorer'
// import { NetworkCreateDto } from '../../src/model/type/network.dto'
// import { DockerCompose } from '../../src/util'
// import { CreateChannelDto, JoinChannelDto, UpdateAnchorPeerDto } from '../../src/model/type/channel.dto'
// import { SetType } from '../../src/model/type/configService.type'
// import Dockerode from 'dockerode'
// import sinon from 'sinon'
// import https from 'https'
// import axios from 'axios'
// import cleanSpace from '../util/cleanSpace'
// import config from '../../src/config'
// import { configstub } from '../util/configStub'

// describe('Explorer service:', function () {
//   this.timeout(10000)
//   const docker: Dockerode = new Dockerode({ socketPath: '/var/run/docker.sock' })
//   const dockerdOption = { all: true }

//   const isContainerAlive = async function (port: number): Promise<boolean> {
//     const totalRetryTime = 3
//     for (let retrytime = 0; retrytime < totalRetryTime; retrytime++) {
//       try {
//         const result = await axios.get(`https://localhost:${port}/healthz`,
//           {
//             httpsAgent: new https.Agent({ rejectUnauthorized: false }),
//           })

//         if (result.data.status !== 'OK') return result.data.status
//         else return true
//       } catch {
//         continue
//       }
//     }
//     return false
//   }

//   const networkCreateDto: NetworkCreateDto = JSON.parse(fs.readFileSync('test/sample/network-create.json').toString())
//   const channelCreateDto: CreateChannelDto = JSON.parse(fs.readFileSync('test/sample/network-create-channel.json').toString())
//   const explorerDockerCompose = `${process.env.HOME}/.bdk/fabric-explorer/docker-compose.yaml`

//   const peerOrgs = networkCreateDto.peerOrgs
//   const ordererOrgs = networkCreateDto.ordererOrgs
//   const processOrdererOrg: string = ordererOrgs[0].name + '.' + ordererOrgs[0].domain

//   const setName: SetType = {
//     key: 'BDK_ORG_NAME',
//     value: 'Ben',
//   }

//   const setDomain: SetType = {
//     key: 'BDK_ORG_DOMAIN',
//     value: 'Ben.ben.cathaybc.com',
//   }

//   const joinChannelDto: JoinChannelDto = {
//     channelName: channelCreateDto.channelName,
//     orderer: processOrdererOrg,
//   }

//   const updateAnchorPeerDto: UpdateAnchorPeerDto = {
//     channelName: channelCreateDto.channelName,
//     orderer: processOrdererOrg,
//   }

//   before(function () {
//     // runs once before the first test in this block
//     configstub.callsFake(function ({ key, value }): void{
//       // makesure Config set modified process configuration
//       const newenv = { [key]: value }
//       config.orgName = newenv.BDK_ORG_NAME || ''
//       config.orgDomainName = newenv.BDK_ORG_DOMAIN || ''
//     })
//   })

//   after(function () {
//     // runs once after the last test in this block
//     configstub.restore()
//   })

//   beforeEach(async function () {
//     // runs before each test in this block
//     await cleanSpace(docker)

//     Config.init()
//     await Network.createFull(networkCreateDto)
//     await Peer.up(['Ben', 'Grace', 'Eugene'])
//     await Orderer.up(['BenOrder', 'GraceOrder'])
//     Channel.create(channelCreateDto)

//     for (const peerOrg of peerOrgs) {
//       setName.value = peerOrg.name
//       setDomain.value = peerOrg.domain
//       Config.set(setName)
//       Config.set(setDomain)
//       Channel.join(joinChannelDto)
//       Channel.updateAnchorPeer(updateAnchorPeerDto)
//     }
//   })

//   afterEach(async () => {
//     // runs after each test in this block
//     await cleanSpace(docker)
//     await new Promise((resolve) => setTimeout(resolve, 1000))
//   })

//   it('[Explorer.down]', async function () {
//     setName.value = peerOrgs[0].name
//     setDomain.value = peerOrgs[0].domain
//     Config.set(setName)
//     Config.set(setDomain)

//     await Explorer.upForMyOrg()
//     assert.strictEqual(await isContainerAlive(8080), true, 'fail to up explorer')

//     const initContainers = await docker.listContainers(dockerdOption)

//     await Explorer.down()

//     assert.strictEqual(await isContainerAlive(8080), false)
//     const upContainers = await docker.listContainers(dockerdOption)
//     assert.strictEqual(upContainers.length, initContainers.length - 2)
//     assert.strictEqual(fs.existsSync(explorerDockerCompose), false)
//   })

//   it('[Explorer.upForMyOrg]', async function () {
//     const initContainers = await docker.listContainers(dockerdOption)
//     await Explorer.upForMyOrg(`peer0.${networkCreateDto.peerOrgs[0].name}.${networkCreateDto.peerOrgs[0].domain}:7051`, networkCreateDto.ordererOrgs[0].domain)
//     const upContainers = await docker.listContainers(dockerdOption)
//     assert.strictEqual(upContainers.length, initContainers.length + 2)
//     assert.strictEqual(await isContainerAlive(8080), true)
//   })

//   it('[Explorer.updateForMyOrg]', async function () {
//     setName.value = peerOrgs[0].name
//     setDomain.value = peerOrgs[0].domain
//     Config.set(setName)
//     Config.set(setDomain)

//     const peersAddress: string = peerOrgs[0].name + '.' + peerOrgs[0].name + ':' +
//         ((peerOrgs[0].ports === undefined) ? '7051' : peerOrgs[0].ports[0].port)
//     await Explorer.upForMyOrg(peersAddress)

//     const updateFileSpy = sinon.spy(fs, 'writeFileSync')
//     const dockerComposeSpy = sinon.spy(DockerCompose, 'restart')
//     await Explorer.updateForMyOrg(`peer0.${networkCreateDto.peerOrgs[0].name}.${networkCreateDto.peerOrgs[0].domain}:7051`, networkCreateDto.ordererOrgs[0].domain)
//     sinon.assert.called(updateFileSpy)
//     sinon.assert.calledOnce(dockerComposeSpy)
//     assert.strictEqual(await isContainerAlive(8080), true)
//   })
// })
