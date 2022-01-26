// /* global describe, it, before, after, beforeEach, afterEach */
// import fs from 'fs'
// import assert from 'assert'
// import TestNetwork from '../../src/service/test-network'
// import Dockerode from 'dockerode'
// import config from '../../src/config'
// import https from 'https'
// import axios from 'axios'

// describe('Test-network service:', function () {
//   this.timeout(10000)

//   const docker: Dockerode = new Dockerode({ socketPath: '/var/run/docker.sock' })
//   const dockerdOption = { all: true }
//   const cleanSpace = async function () {
//     const containers = await docker.listContainers(dockerdOption)
//     // stop and remove all containers
//     for (let i = 0; i < containers.length; i++) {
//       const containerInfo = containers[i]
//       const container = docker.getContainer(containerInfo.Id)
//       await container.remove({ force: true, v: true })
//     }
//     // volume prune
//     await docker.pruneVolumes()
//   }

//   const hostBasePath = `${config.infraConfig.hostPath}/fabric-test-network`
//   const dockerBasePath = config.infraConfig.dockerPath

//   before(async function () {
//     // runs once before the first test in this block
//     await cleanSpace()
//   })

//   after(async function () {
//     // runs once after the last test in this block
//     await cleanSpace()
//   })

//   beforeEach(function () {
//     // runs before each test in this block
//   })

//   afterEach(function () {
//     // runs after each test in this block
//   })

//   const isContainerAlive = function (port: number): boolean {
//     const totalRetryTime = 3
//     for (let retrytime = 0; retrytime < totalRetryTime; retrytime++) {
//       try {
//         const result = axios.get(`https://localhost:${port}/healthz`,
//           {
//             httpsAgent: new https.Agent({ rejectUnauthorized: false }),
//           })

//         if (result.data.status !== 'OK') return false
//         else return true
//       } catch {
//         continue
//       }
//     }
//     return false
//   }

//   it('[Test-network.up]', async function () {
//     TestNetwork.up()

//     // count the number of containiers
//     const containers = await docker.listContainers(dockerdOption)
//     assert.deepStrictEqual(containers, [])

//     // check port
//     const totalRetryTime = 3
//     const peerPorts: number[] = [7051, 9051]
//     const ordererPorts: number[] = [7050]
//     for (const port of peerPorts) {
//       assert.strictEqual(isContainerAlive(port), true)
//     }
//     for (const port of ordererPorts) {
//       assert.strictEqual(isContainerAlive(port), true)
//     }
//     // TODO: check channel
//   })

//   it('[Test-network.down]', async function () {
//     TestNetwork.down()

//     // check containers down
//     const containers = await docker.listContainers(dockerdOption)
//     assert.deepStrictEqual(containers, [])

//     // check volumes remove
//     const volumes = await docker.listVolumes(dockerdOption)
//     assert.deepStrictEqual(volumes, { Volumes: [], Warnings: null })
//   })
// /*
//   it('[Test-network.deployCC]', async function () {

//   })
//   it('[Test-network.invokeCC]', async function () {

//   })
//   it('[Test-network.queryCC]', async function () {

//   })
//   it('[Test-network.deploySampleChaincode]', async function () {

//   })
//   it('[Test-network.upTestNetworkExplorer]', async function () {

//   })
//   it('[Test-network.downExplorer]', async function () {

//   })
//   */
// })
