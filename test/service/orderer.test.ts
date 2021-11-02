// /* global describe, it, before, after, beforeEach, afterEach */
// import fs from 'fs'
// import assert from 'assert'
// import config from '../../src/config'
// import { NetworkCreateDto, NetworkCreateOrdererOrg, CryptoConfigOrdererOrg } from '../../src/model/type/network.dto'
// import CryptoConfigYaml from '../../src/util/yaml/network/cryptoConfigYaml'
// import network from '../../src/service/network'
// import orderer from '../../src/service/orderer'
// import Dockerode from 'dockerode'
// import https from 'https'
// import axios from 'axios'
// import sinon from 'sinon'
// import cleanSpace from '../util/cleanSpace'

// describe('Orderer service:', function () {
//   // this.slow(300000); // five minutes
//   this.timeout(60000)

//   const networkCreateDto: NetworkCreateDto = JSON.parse(fs.readFileSync('test/sample/network-create.json').toString())
//   const docker: Dockerode = new Dockerode({ socketPath: '/var/run/docker.sock' })
//   const dockerdOption = { all: true }
//   before(async function () {
//     // runs once before the first test in this block
//     await cleanSpace(docker)
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//     await network.createFull(networkCreateDto)
//   })

//   after(async function () {
//     // runs once after the last test in this block
//     await cleanSpace(docker)
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//   })

//   beforeEach(function () {
//     // runs before each test in this block
//   })

//   afterEach(async function () {
//     // runs after each test in this block
//     await cleanSpace(docker)
//   })
//   // test up down orderer
//   networkCreateDto.ordererOrgs.map((ordererorg) => {
//     it(`[Orderer.up] ${ordererorg.name}`, async function () {
//       await orderer.up(ordererorg.hostname.map(host => `${host}.${ordererorg.domain}`))
//       const totalRetryTime = 3
//       for (let retrytime = 0; retrytime < totalRetryTime; retrytime++) {
//         await new Promise(resolve => { setTimeout(resolve, 1000) })
//         assert(ordererorg.ports)
//         let errorderers: string[] = []
//         try {
//           for (let i = 0; i < ordererorg.ports.length; i++) {
//             const result = await axios.get(`https://localhost:${ordererorg.ports[i].operationPort}/healthz`,
//               {
//                 httpsAgent: new https.Agent({ rejectUnauthorized: false }),
//               })
//             if (result.data.status !== 'OK')errorderers = [...errorderers, `${ordererorg.hostname[i]}:${JSON.stringify(result.data)}`]
//           }
//         } catch (error) {
//           if (retrytime !== totalRetryTime) continue
//           throw error
//         }
//         assert.deepStrictEqual(errorderers, [], 'dead orderers')
//         break
//       }
//       const containers = await docker.listContainers(dockerdOption)
//       assert.deepStrictEqual(containers.map(x => x.Names[0]).sort(), ordererorg.hostname.map(x => `/${x}.${ordererorg.domain}`).sort())
//     })
//     it(`[Orderer.down] ${ordererorg.name}`, async function () {
//       await orderer.up(ordererorg.hostname.map(host => `${host}.${ordererorg.domain}`))
//       await orderer.down(ordererorg.hostname.map(host => `${host}.${ordererorg.domain}`))

//       const containers = await docker.listContainers(dockerdOption)
//       assert.deepStrictEqual(containers, [])
//       const volumes = await docker.listVolumes(dockerdOption)
//       assert.deepStrictEqual(volumes, { Volumes: [], Warnings: null })
//     })
//   })
//   const createOrdererOrgDto: NetworkCreateOrdererOrg = JSON.parse(fs.readFileSync('test/sample/network-create-orderer.json').toString())
//   // test order add
//   it('[Orderer add] LiamOrderer', function () {
//     const stub = sinon.stub(orderer, 'createDockerComposeYaml')
//     orderer.add(createOrdererOrgDto.name, createOrdererOrgDto.domain, createOrdererOrgDto.hostname, 'genesis', createOrdererOrgDto.ports)
//     sinon.assert.calledOnceWithExactly(stub, createOrdererOrgDto.name, createOrdererOrgDto.domain, createOrdererOrgDto.hostname, 'genesis', createOrdererOrgDto.ports)
//     stub.restore()
//   })
//   it('[Orderer createDockerComposeYaml]', function () {
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//     // const DockerComposeYamlspy = sinon.spy(orderer.bdkFile, 'createDockerComposeYaml')
//     orderer.createDockerComposeYaml(createOrdererOrgDto.name, createOrdererOrgDto.domain, createOrdererOrgDto.hostname, 'genesis', createOrdererOrgDto.ports)
//     // TODO check spy call correctilly
//     // const ordererDockerComposeYaml = new OrdererDockerComposeYaml()
//     // sinon.assert.calledWith(DockerComposeYamlspy, createOrdererOrgDto.name, ordererDockerComposeYaml)
//     // DockerComposeYamlspy.restore()
//     const exist_fname: string[] = []
//     exist_fname.concat(createOrdererOrgDto.hostname.map(hostname => `docker-compose/docker-compose-orderer-${hostname}.${createOrdererOrgDto.domain}.yaml`))
//     exist_fname.concat(createOrdererOrgDto.hostname.map(hostname => `env/orderer-${hostname}.${createOrdererOrgDto.domain}.env`))
//     exist_fname.forEach(filename => {
//       assert(fs.existsSync(`${config.infraConfig.hostPath}/${config.networkName}/${filename}`), `config file "${filename}" not exist`)
//     })
//     // TODO check content of yaml
//     // assert.strictEqual(fs.readFileSync(`${config.infraConfig.hostPath}/${config.networkName}/docker-compose/docker-compose-LiamOrderer.yaml`).toString(),
//     // 'something')
//   })

//   // test create orderer
//   const networkCreateOrdererOrgDto: NetworkCreateOrdererOrg[] = networkCreateDto.ordererOrgs
//   it('[Orderer create] LiamOrderer', async function () {
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//     const CryptoConfigYamlspy = sinon.spy(orderer.bdkFile, 'createCryptoConfigYaml')
//     const Configtxspy = sinon.spy(orderer.bdkFile, 'createConfigtx')
//     const DockerComposeYamlspy = sinon.spy(orderer, 'createDockerComposeYaml')
//     await orderer.create(networkCreateOrdererOrgDto)
//     // TODO check spy call correctilly
//     // sinon.assert.calledOnceWithExactly(CryptoConfigYamlspy, args)
//     // sinon.assert.calledOnceWithExactly(Configtxspy, args)
//     // networkCreateOrdererOrgDto.forEach((ordererOrg) => {
//     //   sinon.assert.calledWithExactly(DockerComposeYamlspy, ordererOrg.name, ordererOrg.domain, ordererOrg.hostname, ordererOrg.ports)
//     // })
//     CryptoConfigYamlspy.restore()
//     Configtxspy.restore()
//     DockerComposeYamlspy.restore()
//     // TODO check file exist
//     const files_should_exist = [
//       'config-yaml/configtx.yaml',
//       'config-yaml/crypto-config.yaml',
//     ]
//     files_should_exist.forEach(filename => {
//       assert(fs.existsSync(`${config.infraConfig.hostPath}/${config.networkName}/${filename}`), `config file "${filename}" not exist`)
//     })
//   })
//   // test createCryptoConfigYaml
//   const createCryptoConfigYamldto: CryptoConfigOrdererOrg[] = networkCreateDto.ordererOrgs
//   it('[Orderer createCryptoConfigYaml] ', function () {
//     const get: CryptoConfigYaml|null = orderer.createCryptoConfigYaml(createCryptoConfigYamldto)
//     const want =
//     {
//       OrdererOrgs: [
//         {
//           Domain: 'ben.cathaybc.com',
//           EnableNodeOUs: true,
//           Name: 'BenOrderer',
//           Specs: [
//             {
//               Hostname: 'orderer0',
//             },
//             {
//               Hostname: 'orderer1',
//             },
//           ],
//         },
//         {
//           Domain: 'grace.cathaybc.com',
//           EnableNodeOUs: true,
//           Name: 'GraceOrderer',
//           Specs: [
//             {
//               Hostname: 'orderer0',
//             },
//           ],
//         },
//       ],
//     }
//     assert(get)
//     assert.deepStrictEqual(get.value, want)
//   })
// })
