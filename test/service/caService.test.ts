// /* global describe, it, before, after, beforeEach, afterEach */
// import fs from 'fs'
// import assert from 'assert'
// import {
//   CaServiceUpType,
//   CaServiceRegisterType,
//   CaCommandEnrollType,
//   CaEnrollTypeEnum,
// } from '../../src/model/type/caService.type'
// import { caServiceUp, caServiceDown, caServiceEnroll, caServiceRegister } from '../../src/service/caService'
// import Dockerode from 'dockerode'
// import sinon from 'sinon'
// import https from 'https'
// import axios from 'axios'
// import config from '../../src/config'
// import cleanSpace from '../util/cleanSpace'

// describe('CA service:', function () {
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
//   const caConfig: CaServiceUpType = JSON.parse(fs.readFileSync('test/sample/caService.json').toString())
//   const yamlPath = `${config.infraConfig.hostPath}/${config.networkName}/docker-compose/docker-compose-ca-${caConfig.basic.caName}.yaml`

//   before(function () {
//     // runs once before the first test in this block
//   })

//   after(function () {
//     // runs once after the last test in this block
//   })

//   beforeEach(async function () {
//     // runs before each test in this block
//     await cleanSpace(docker)
//     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
//   })

//   afterEach(async function () {
//     // runs after each test in this block
//     await cleanSpace(docker)
//     await new Promise(resolve => setTimeout(resolve, 5000))
//   })

//   it('[CAService.up]', async function () {
//     const preDocker = await docker.listContainers(dockerdOption)
//     // up
//     await caServiceUp(caConfig, false)
//     // check docker-compose.yaml
//     assert.strictEqual(fs.existsSync(yamlPath), true, `${yamlPath}`)
//     // check container
//     const postDocker = await docker.listContainers(dockerdOption)
//     assert.strictEqual(postDocker.length, preDocker.length + 1, 'no new docker container create')
//     // assert.strictEqual(await isContainerAlive(caConfig.basic.port), true, 'port 7054 is not avaliable')
//   })

//   it('[CAService.down]', async function () {
//     // up
//     await caServiceUp(caConfig, false)
//     // assert.strictEqual(await isContainerAlive(caConfig.basic.port), true, 'CA service up failed')
//     const preDocker = await docker.listContainers(dockerdOption)
//     await caServiceDown(caConfig.basic.caName)
//     // check container
//     // assert.strictEqual(await isContainerAlive(caConfig.basic.port), false, 'port 7054 is avaliable')
//     const postDocker = await docker.listContainers(dockerdOption)
//     assert.strictEqual(postDocker.length, preDocker.length - 1, 'no docker container was closed')
//   })

//   // it('[CAService.enroll]', async function () {
//   // })

//   // it('[CAService.register]', async function () {
//   // })
// })
