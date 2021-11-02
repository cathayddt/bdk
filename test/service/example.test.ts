// /* global describe, it, before, after, beforeEach, afterEach */
// import config from '../../src/config'
// import { Infra } from '../../src/util'

// describe('Example unit test:', function () {
//   // this.slow(300000); // five minutes
//   this.timeout(5000)

//   before(function () {
//     // runs once before the first test in this block
//   })

//   after(function () {
//     // runs once after the last test in this block
//   })

//   beforeEach(function () {
//     // runs before each test in this block
//   })

//   afterEach(function () {
//     // runs after each test in this block
//   })

//   it('[environment] Docker', async function () {
//     const runner = new Infra()
//     await runner.runCommand({
//       image: 'hyperledger/fabric-tools',
//       tag: config.fabricVersion.tools,
//       commands: ['cryptogen', 'version'],
//     })
//     await runner.runCommand({
//       image: 'hyperledger/fabric-peer',
//       tag: config.fabricVersion.tools,
//       commands: ['peer', 'version'],
//     })
//     await runner.runCommand({
//       image: 'hyperledger/fabric-orderer',
//       tag: config.fabricVersion.tools,
//       commands: ['orderer', 'version'],
//     })
//     // assert.strictEqual(a.stdout,0);
//   })
// })
