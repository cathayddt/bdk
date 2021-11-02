// /* global describe, it, before, after, beforeEach, afterEach */
// import fs from 'fs'
// import assert from 'assert'
// import config from '../../src/config'
// import { NetworkCreateDto, NetworkCreatePeerOrg, CryptoConfigPeerOrg } from '../../src/model/type/network.dto'
// import CryptoConfigYaml from '../../src/util/yaml/network/cryptoConfigYaml'
// import network from '../../src/service/network'
// import peer from '../../src/service/peer'
// import Dockerode from 'dockerode'
// import https from 'https'
// import axios from 'axios'
// import sinon from 'sinon'
// import cleanSpace from '../util/cleanSpace'

// describe('Peer service:', function () {
//   // this.slow(300000); // five minutes
//   this.timeout(60000)

//   const networkCreateDto: NetworkCreateDto = JSON.parse(fs.readFileSync('test/sample/network-create.json').toString())
//   const docker: Dockerode = new Dockerode({ socketPath: '/var/run/docker.sock' })
//   const dockerdOption = { all: true }
//   before(async function () {
//     // runs once before the first test in this block
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//     await network.createFull(networkCreateDto)
//     await cleanSpace(docker)
//   })
//   after(function () {
//     // runs once after the last test in this block
//   })
//   afterEach(async function () {
//     // runs after each test in this block
//     await cleanSpace(docker)
//   })

//   beforeEach(function () {
//     // runs before each test in this block
//   })
//   networkCreateDto.peerOrgs.map((peerorg) => {
//     it(`[Peer.up] ${peerorg.name}`, async function () {
//       let peerhostnames: string[] = []
//       for (let i = 0; i < peerorg.peerCount; i++) {
//         peerhostnames = [...peerhostnames, `peer${i}.${peerorg.domain}`]
//       }
//       await peer.up(peerhostnames)
//       const totalRetryTime = 3
//       for (let retrytime = 0; retrytime < totalRetryTime; retrytime++) {
//         await new Promise(resolve => { setTimeout(resolve, 1000) })
//         let errpeers: string[] = []
//         assert(peerorg.ports)
//         try {
//           for (let i = 0; i < peerorg.peerCount; i++) {
//             const result = await axios.get(`https://localhost:${peerorg.ports[i].operationPort}/healthz`,
//               {
//                 httpsAgent: new https.Agent({ rejectUnauthorized: false }),
//               })
//             if (result.data.status !== 'OK')errpeers = [...errpeers, `peer${i}:${JSON.stringify(result.data)}`]
//           }
//         } catch (error) {
//           if (retrytime !== totalRetryTime - 1) continue
//           throw error
//         }
//         assert.deepStrictEqual(errpeers, [], 'dead peers')
//         break
//       }
//       const containers = await docker.listContainers(dockerdOption)
//       assert.deepStrictEqual(containers.map(x => x.Names[0]).sort(), Array.from({ length: peerorg.peerCount }, (_, i) => `/peer${i}.${peerorg.domain}`).sort())
//     })
//     it(`[Peer.down] ${peerorg.name}`, async function () {
//       let peerhostnames: string[] = []
//       for (let i = 0; i < peerorg.peerCount; i++) {
//         peerhostnames = [...peerhostnames, `peer${i}.${peerorg.domain}`]
//       }
//       await peer.up(peerhostnames)
//       peer.down(peerhostnames)
//       const containers = await docker.listContainers(dockerdOption)
//       assert.deepStrictEqual(containers, [])
//       const volumes = await docker.listVolumes(dockerdOption)
//       assert.deepStrictEqual(volumes, { Volumes: [], Warnings: null })
//     })
//   })
//   const createPeerOrgDto: NetworkCreatePeerOrg = JSON.parse(fs.readFileSync('test/sample/network-create-peer.json').toString())
//   it('[Peer add] Liam', function () {
//     const stub = sinon.stub(peer, 'createDockerComposeYaml')
//     peer.add(createPeerOrgDto.name, createPeerOrgDto.domain, createPeerOrgDto.peerCount, createPeerOrgDto.ports)
//     sinon.assert.calledOnceWithExactly(stub, createPeerOrgDto.name, createPeerOrgDto.domain, createPeerOrgDto.peerCount, createPeerOrgDto.ports)
//     stub.restore()
//   })
//   it('[Peer createDockerComposeYaml] Liam', function () {
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//     peer.createDockerComposeYaml(createPeerOrgDto.name, createPeerOrgDto.domain, createPeerOrgDto.peerCount, createPeerOrgDto.ports)

//     let exist_fname: string[] = []
//     for (let i = 0; i < createPeerOrgDto.peerCount; i++) {
//       exist_fname = [
//         ...exist_fname,
//         `docker-compose/docker-compose-peer-peer${i}.${createPeerOrgDto.domain}.yaml`,
//         `env/peer-peer${i}.${createPeerOrgDto.domain}.env`,
//       ]
//     }
//     exist_fname.forEach(filename => {
//       assert(fs.existsSync(`${config.infraConfig.hostPath}/${config.networkName}/${filename}`), `config file "${filename}" not exist`)
//     })

//     // TODO check content of yaml
//     // assert.strictEqual(fs.readFileSync(`${config.infraConfig.hostPath}/${config.networkName}/docker-compose/docker-compose-LiamOrderer.yaml`).toString(),
//     // 'something')
//     assert(createPeerOrgDto.ports)
//     for (let i = 0; i < createPeerOrgDto.peerCount; i++) {
//       assert.strictEqual(
//         fs.readFileSync(`${config.infraConfig.hostPath}/${config.networkName}/env/peer-peer${i}.${createPeerOrgDto.domain}.env`).toString(),
//         `FABRIC_CFG_PATH=/etc/hyperledger/fabric\nCORE_PEER_TLS_ENABLED=true\nCORE_PEER_LOCALMSPID=LiamMSP\nCORE_PEER_TLS_ROOTCERT_FILE=/tmp/peerOrganizations/liam.cathaybc.com/peers/peer0.liam.cathaybc.com/tls/ca.crt\nCORE_PEER_MSPCONFIGPATH=/tmp/peerOrganizations/liam.cathaybc.com/users/Admin@liam.cathaybc.com/msp\nCORE_PEER_ADDRESS=peer${i}.liam.cathaybc.com:${createPeerOrgDto.ports[i].port}`,
//         `env file peer-peer${i}.${createPeerOrgDto.domain}.env wrong`)
//     }
//   })
//   const createCryptoConfigYamldto: CryptoConfigPeerOrg[] = networkCreateDto.peerOrgs
//   it('[Peer createCryptoConfigYaml] ', function () {
//     const get: CryptoConfigYaml|null = peer.createCryptoConfigYaml(createCryptoConfigYamldto)
//     const want =
//     {
//       PeerOrgs: [
//         {
//           Domain: 'ben.cathaybc.com',
//           EnableNodeOUs: true,
//           Name: 'Ben',
//           Template: {
//             Count: 1,
//           },
//           Users: {
//             Count: 1,
//           },
//         },
//         {
//           Domain: 'grace.cathaybc.com',
//           EnableNodeOUs: true,
//           Name: 'Grace',
//           Template: {
//             Count: 1,
//           },
//           Users: {
//             Count: 1,
//           },
//         },
//         {
//           Domain: 'eugene.cathaybc.com',
//           EnableNodeOUs: true,
//           Name: 'Eugene',
//           Template: {
//             Count: 1,
//           },
//           Users: {
//             Count: 1,
//           },
//         },
//       ],
//     }
//     assert(get)
//     assert.deepStrictEqual(get.value, want)
//   })
// })
