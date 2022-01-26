// /* global describe, it, before, after, beforeEach, afterEach */
// import fs from 'fs'
// import assert from 'assert'
// import Channel from '../../src/service/channel'
// import Network from '../../src/service/network'
// import Peer from '../../src/service/peer'
// import Orderer from '../../src/service/orderer'
// import Chaincode from '../../src/service/chaincode'
// import Config from '../../src/service/config'
// import { NetworkCreateDto } from '../../src/model/type/network.dto'
// import { CreateChannelDto, JoinChannelDto, UpdateAnchorPeerDto, PolicyTypeEnum } from '../../src/model/type/channel.dto'
// import Dockerode from 'dockerode'
// import sinon from 'sinon'
// import config from '../../src/config'
// import cleanSpace from '../util/cleanSpace'
// import https from 'https'
// import axios from 'axios'
// import { configstub } from '../util/configStub'

// import { PackageDto, DeployDto, QueryDto, InvokeDto } from '../../src/model/type/chaincode.dto'
// import FabricTools from '../../src/instance/fabricTools'

// describe('Chaincode service:', function () {
//   this.timeout(10000)
//   const chaincodeLabel = 'fabcar_1'
//   const packagePath = `${config.infraConfig.hostPath}/${config.networkName}/chaincode/${chaincodeLabel}.tar.gz`
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
//   const channelCreateDto: CreateChannelDto = JSON.parse(fs.readFileSync('test/sample/channel-create.json').toString())

//   const peerOrgs: {'name': string;'domain': string}[] = []
//   for (const peerOrg of networkCreateDto.peerOrgs) {
//     peerOrgs.push({ name: peerOrg.name, domain: peerOrg.domain })
//   }
//   const ordererOrgNames: string[] = []
//   for (const ordererOrg of networkCreateDto.ordererOrgs) {
//     ordererOrgNames.push(ordererOrg.name)
//   }

//   const processOrdererOrg: string = channelCreateDto.orderer
//   const joinChannelDto: JoinChannelDto = {
//     channelName: channelCreateDto.channelName,
//     orderer: processOrdererOrg,
//   }

//   const updateAnchorPeerDto: UpdateAnchorPeerDto = {
//     channelName: channelCreateDto.channelName,
//     orderer: processOrdererOrg,
//   }

//   before(async function () {
//     // runs once before the first test in this block
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//     await cleanSpace(docker)
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

//     await Network.createFull(networkCreateDto)
//     await Orderer.up(networkCreateDto.ordererOrgs.reduce((hostnames: string[], ordererorg) => {
//       return hostnames.concat(ordererorg.hostname.map(host => `${host}.${ordererorg.domain}`))
//     }, []))

//     await Peer.up(networkCreateDto.peerOrgs.reduce((peerhostnames: string[], peerorg) => {
//       let peerhostname: string[] = []
//       for (let i = 0; i < peerorg.peerCount; i++) {
//         peerhostname = [...peerhostname, `peer${i}.${peerorg.domain}`]
//       }
//       return [...peerhostnames, ...peerhostname]
//     }, []))
//     await new Promise(resolve => { setTimeout(resolve, 1000) })
//     try {
//       await Channel.create(channelCreateDto)
//       for (const orgName of channelCreateDto.orgNames) {
//         Config.set({ key: 'BDK_ORG_NAME', value: orgName })
//         Config.set({ key: 'BDK_ORG_DOMAIN', value: networkCreateDto.peerOrgs.filter(x => x.name === orgName)[0].domain })
//         await Channel.join(joinChannelDto)
//         await Channel.updateAnchorPeer(updateAnchorPeerDto)
//       }
//     } catch (e) {
//       console.log(e)
//     }
//   })

//   after(async function () {
//     // runs once after the last test in this block
//     // Peer.down(["Ben", "Grace","Eugene"]);
//     // Orderer.down(["BenOrder", "GraceOrder"]);
//     // Network.delete(`$BDK_NETWORK_NAME`); //TODO: network name
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//     await cleanSpace(docker)
//   })

//   beforeEach(function () {
//     // runs before each test in this block
//   })

//   afterEach(function () {
//     // runs after each test in this block
//   })

//   const packageDto: PackageDto = {
//     name: 'fabcar',
//     version: 1,
//     path: 'test/sample/chaincode/fabcar/go',
//   }

//   it('[Chaincode.package]', async function () {
//     if (fs.existsSync(packagePath)) {
//       fs.rmSync(packagePath)
//     }
//     await Chaincode.package(packageDto)
//     assert.strictEqual(fs.existsSync(packagePath), true, 'chaincode package file not exist')
//   })

//   const deployDto: DeployDto = {
//     channelId: 'mychannel',
//     label: 'fabcar_1',
//     approve: true,
//     commit: false,
//     initRequired: true,
//     orderer: 'orderer0.ben.cathaybc.com',
//     peerAddresses: ['Ben.ben.cathaybc.com', 'Grace.grace.cathaybc.com', 'Eugene.eugene.cathaybc.com'],
//   }

//   it('[Chaincode.deploy]', async function () {
//     config.dockerLogging = true
//     for (const orgName of channelCreateDto.orgNames) {
//       Config.set({ key: 'BDK_ORG_NAME', value: orgName })
//       Config.set({ key: 'BDK_ORG_DOMAIN', value: networkCreateDto.peerOrgs.filter(x => x.name === orgName)[0].domain })

//       const precontainer = await docker.listContainers(dockerdOption)

//       //   TODO: try...catch to restore spy
//       const approveSpy = sinon.spy(FabricTools, 'approveChaincode')
//       const commitSpy = sinon.spy(FabricTools, 'commitChaincode')

//       await Chaincode.deploy(deployDto)

//       if (deployDto.approve) {
//         const postcontainer = await docker.listContainers(dockerdOption)
//         assert.strictEqual(precontainer.length + 1, postcontainer.length)
//         assert.strictEqual(isContainerAlive(7052), true)
//         sinon.assert.calledOnce(approveSpy)
//       }
//       if (deployDto.commit) {
//         // verify chaincode has been commit
//         sinon.assert.calledOnce(commitSpy)
//       }
//       approveSpy.restore()
//       commitSpy.restore()
//     }
//     deployDto.approve = false
//     deployDto.commit = true
//     await Chaincode.deploy(deployDto)
//   })

//   const invokeDto: InvokeDto = {
//     channelId: 'mychannel',
//     chaincodeName: 'fabcar_1',
//     chaincodeFunction: 'CreateCar',
//     args: ['CAR999', 'BMW', 'X6', 'blue', 'Raymond'],
//     isInit: true,
//     orderer: 'orderer0.ben.cathaybc.com',
//     peerAddresses: ['Ben.ben.cathaybc.com', 'Grace.grace.cathaybc.com', 'Eugene.eugene.cathaybc.com'],
//   }

//   it('[Chaincode.invoke]', async function () {
//     const invokeSpy = sinon.spy(FabricTools, 'queryChaincode')
//     await Chaincode.invoke(invokeDto)
//     const response = Chaincode.invoke(invokeDto)
//     sinon.assert.calledOnce(invokeSpy)
//     assert(response, '')
//     invokeSpy.restore()
//   })

//   const queryDto: QueryDto = {
//     channelId: 'mychannel',
//     chaincodeName: 'fabcar',
//     chaincodeFunction: 'QueryAllCars',
//     args: [],
//   }

//   it('[Chaincode.query]', async function () {
//     const querySpy = sinon.spy(FabricTools, 'queryChaincode')

//     const response = await Chaincode.query(queryDto)

//     sinon.assert.calledOnce(querySpy)
//     /*
//     const containersInfo = await docker.listContainers(dockerdOption);
//     const container = docker.getContainer(containersInfo[0].Id);
//     const log = container.logs({'stdout':true})
//     assert(log, "");
// */
//     assert(response, '')
//     querySpy.restore()
//   })
// })
