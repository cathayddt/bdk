/* global describe, it, before, after */
import fs from 'fs'
import assert from 'assert'
import tar from 'tar'
import sinon from 'sinon'
import { resolve } from 'path'
import config from '../../../src/quorum/config'
import Backup from '../../../src/quorum/service/backup'
import Network from '../../../src/quorum/service/network'
import { BackupError, sleep } from '../../../src/util'
import { NetworkCreateType } from '../../../src/quorum/model/type/network.type'

// write a test for the backup class
describe('Quorum.Backup', function () {
  this.timeout(100000)

  const backup = new Backup(config)
  const network = new Network(config)
  const bdkPath = 'test/bdk'

  before(async function () {
    const networkCreate: NetworkCreateType = {
      chainId: 13371,
      validatorNumber: 1,
      memberNumber: 1,
      alloc: [],
    }
    await network.create(networkCreate)
  })

  after(async () => {
    // Delete all backup files
    fs.rmSync(resolve(`${bdkPath}/backup`), { recursive: true })
    await network.delete()
  })

  // create a new backup instance
  describe('Quorum.Backup.exportAll', () => {
    it('should create a backup tarball for all items', async () => {
      backup.exportAll()
      await sleep(1000)
      const backupItems = backup.getBackupItems()
      assert(backupItems.length > 0, 'No backup items found')

      backupItems.forEach(item => {
        const filePath = resolve(`${bdkPath}/backup/${item.value}`)
        assert(fs.existsSync(filePath), `Backup file not found: ${filePath}`)
      })
    })

    it('should have error when tarball error', async () => {
      const stub = sinon.stub(tar, 'c').throws(new BackupError('tarball error'))
      await assert.rejects(async () => { await backup.exportAll() }, BackupError)
      stub.restore()
    })
  })

  describe('Quorum.Backup.export', () => {
    it('should create a validator backup tarball for a single node', async () => {
      const nodeName = 'validator0' // Replace with your actual node name
      backup.export(nodeName)
      await sleep(1000)
      const backupItems = backup.getBackupItems()
      const nodeBackup = backupItems.find(item => item.title.includes(nodeName))
      assert(nodeBackup, `No backup item found for node: ${nodeName}`)

      const filePath = resolve(`${bdkPath}/backup/${nodeBackup.value}`)
      assert(fs.existsSync(filePath), `Backup file not found: ${filePath}`)
    })

    it('should create a member backup tarball for a single node', async () => {
      const nodeName = 'member0' // Replace with your actual node name
      backup.export(nodeName)
      await sleep(1000)
      const backupItems = backup.getBackupItems()
      const nodeBackup = backupItems.find(item => item.title.includes(nodeName))
      assert(nodeBackup, `No backup item found for node: ${nodeName}`)

      const filePath = resolve(`${bdkPath}/backup/${nodeBackup.value}`)
      assert(fs.existsSync(filePath), `Backup file not found: ${filePath}`)
    })

    it('should have error when tarball error', async () => {
      const stub = sinon.stub(tar, 'c').throws(new BackupError('tarball error'))
      const nodeName = 'validator0'
      await assert.rejects(async () => { await backup.export(nodeName) }, BackupError)
      stub.restore()
    })
  })

  describe('Quorum.Backup.getExportItems', () => {
    it('should return a list of export items', () => {
      const exportItems = backup.getExportItems()
      assert(Array.isArray(exportItems), 'Export items are not an array')
      assert(exportItems.length > 0, 'No export items found')
    })
  })

  describe('Quorum.Backup.getBackupItems', () => {
    it('should return a list of backup items', () => {
      const backupItems = backup.getBackupItems()
      assert(Array.isArray(backupItems), 'Backup items are not an array')
      assert(backupItems.length > 0, 'No backup items found')
    })
  })

  describe('Quorum.Backup.import', () => {
    it('should import a backup tarball', async () => {
      fs.rmSync(resolve(`${bdkPath}/bdk-quorum-network`), { recursive: true })
      fs.mkdirSync(resolve(`${bdkPath}/bdk-quorum-network`))
      await sleep(500)

      const backupItems = backup.getBackupItems()
      const backupItem = backupItems[0] // Choose any backup item for import
      backup.import(backupItem.value)
      await sleep(500)

      assert(fs.readdirSync(resolve(`${bdkPath}/bdk-quorum-network`)).length > 0, 'No files found in bdk-quorum-network folder')
    })

    it('should have error when tarball error', async () => {
      const stub = sinon.stub(tar, 'x').throws(new BackupError('tarball error'))
      const backupItems = backup.getBackupItems()
      await assert.rejects(async () => { await backup.import(backupItems[0].value) }, BackupError)
      stub.restore()
    })
  })
})
