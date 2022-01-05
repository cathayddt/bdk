/* global describe, it, before, after, beforeEach, afterEach */
// import fs from 'fs'
// import assert from 'assert'
// import config from '../../src/config'
// import { NetworkCreateType } from '../../src/model/type/network.type'
// import network from '../../src/service/network'

describe('Network service:', function () {
//   // this.slow(300000); // five minutes
//   this.timeout(5000)

  //   const networkCreateDto: NetworkCreateType = JSON.parse(fs.readFileSync('test/sample/network-create.json').toString())

  //   before(function () {
  //     // runs once before the first test in this block
  //   })

  //   after(function () {
  //     // runs once after the last test in this block
  //   })

  //   beforeEach(function () {
  //     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
  //     // runs before each test in this block
  //   })

  //   afterEach(function () {
  //     fs.rmdirSync(`${config.infraConfig.hostPath}`, { recursive: true })
  //     // runs after each test in this block
  //   })

  //   it('[Network.create]', async function () {
  //     // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  //     // @ts-ignore
  //     await network.create(networkCreateDto)
  //     let files_should_exist = [
  //       'config-yaml/configtx.yaml',
  //       'config-yaml/orgs/peer-Ben.json',
  //       'config-yaml/orgs/peer-Grace.json',
  //       'config-yaml/orgs/peer-Eugene.json',
  //       'config-yaml/orgs/orderer-BenOrderer.json',
  //       'config-yaml/orgs/orderer-GraceOrderer.json',
  //       'config-yaml/crypto-config.yaml',
  //       'docker-compose/docker-compose-orderer-orderer0.ben.cathaybc.com.yaml',
  //       'docker-compose/docker-compose-orderer-orderer1.ben.cathaybc.com.yaml',
  //       'docker-compose/docker-compose-orderer-orderer0.grace.cathaybc.com.yaml',
  //       'docker-compose/docker-compose-peer-peer0.ben.cathaybc.com.yaml',
  //       'docker-compose/docker-compose-peer-peer0.grace.cathaybc.com.yaml',
  //       'docker-compose/docker-compose-peer-peer0.eugene.cathaybc.com.yaml',
  //       'system-genesis-block/genesis.block',
  //     ]
  //     // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  //     // @ts-ignore
  //     networkCreateDto.ordererOrgs.forEach(ordererorg => {
  //       const ordererdomain: string = ordererorg.domain
  //       const ordererhostnamess: Array<string> = ordererorg.hostname
  //       files_should_exist = [...files_should_exist,
  //         `ordererOrganizations/${ordererdomain}/ca/ca.${ordererdomain}-cert.pem`,
  //         `ordererOrganizations/${ordererdomain}/ca/priv_sk`,
  //         `ordererOrganizations/${ordererdomain}/msp/admincerts`,
  //         `ordererOrganizations/${ordererdomain}/msp/cacerts/ca.${ordererdomain}-cert.pem`,
  //         `ordererOrganizations/${ordererdomain}/msp/config.yaml`,
  //         `ordererOrganizations/${ordererdomain}/msp/tlscacerts/tlsca.${ordererdomain}-cert.pem`,
  //         `ordererOrganizations/${ordererdomain}/tlsca/priv_sk`,
  //         `ordererOrganizations/${ordererdomain}/tlsca/tlsca.${ordererdomain}-cert.pem`,
  //         `ordererOrganizations/${ordererdomain}/users/Admin@${ordererdomain}`,
  //         // more under
  //         ...ordererhostnamess.map(x => `ordererOrganizations/${ordererdomain}/orderers/${x}.${ordererdomain}`),
  //         // more under
  //         ...ordererhostnamess.map(x => `tlsca/${x}.${ordererdomain}/ca.crt`),
  //       ]
  //     })
  //     // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  //     // @ts-ignore
  //     networkCreateDto.peerOrgs.forEach(peerorg => {
  //       const peerdomain: string = peerorg.domain
  //       const peername: string = peerorg.name
  //       files_should_exist = [...files_should_exist,
  //         `peerOrganizations/${peerdomain}/ca/ca.${peerdomain}-cert.pem`,
  //         `peerOrganizations/${peerdomain}/ca/priv_sk`,
  //         `peerOrganizations/${peerdomain}/connection-${peername}.json`,
  //         `peerOrganizations/${peerdomain}/connection-${peername}.yaml`,

//         `peerOrganizations/${peerdomain}/msp/admincerts`,
//         `peerOrganizations/${peerdomain}/msp/cacerts/ca.${peerdomain}-cert.pem`,
//         `peerOrganizations/${peerdomain}/msp/config.yaml`,
//         `peerOrganizations/${peerdomain}/msp/tlscacerts/tlsca.${peerdomain}-cert.pem`,
//         `peerOrganizations/${peerdomain}/tlsca/priv_sk`,
//         `peerOrganizations/${peerdomain}/tlsca/tlsca.${peerdomain}-cert.pem`,
//         `peerOrganizations/${peerdomain}/users/Admin@${peerdomain}`,
//         // more under
//         `peerOrganizations/${peerdomain}/peers/peer0.${peerdomain}`,
//         // more under
//         `tlsca/peer0.${peerdomain}/ca.crt`,
//       ]
//     })
//     files_should_exist.forEach(filename => {
//       assert.strictEqual(fs.existsSync(`${config.infraConfig.hostPath}/${config.networkName}/${filename}`), true, `network config file "${filename}" not exist`)
//     })
//   })
//   it('[Network.delete] delete wrong network', function () {
//     const networkname = 'testnet'
//     fs.mkdirSync(`${config.infraConfig.hostPath}/${networkname}`, { recursive: true })
//     network.delete('wrong network name')
//     assert.strictEqual(fs.existsSync(`${config.infraConfig.hostPath}/testnet`), true, 'network config file delete error')
//   })
//   it('[Network.delete] delete correct network', function () {
//     const networkname: string = config.networkName
//     fs.mkdirSync(`${config.infraConfig.hostPath}/${networkname}`, { recursive: true })
//     network.delete(`${networkname}`)
//     assert.strictEqual(fs.existsSync(`${config.infraConfig.hostPath}/${networkname}`), false, 'network config file still exist')
//   })
})
