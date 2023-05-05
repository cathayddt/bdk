/* global describe, it, before, after */
import fs from 'fs'
import assert from 'assert'
import tar from 'tar'
import sinon from 'sinon'
import { resolve } from 'path'
import config from '../../../src/fabric/config'
import Backup from '../../../src/fabric/service/backup'
import { BackupError, sleep } from '../../../src/util'
import MinimumNetwork from '../util/minimumNetwork'
import Config from '../../../src/fabric/service/config'

// write a test for the backup class
describe('Fabric.Backup', function () {
  this.timeout(100000)

  const backup = new Backup(config)
  const minimumNetwork = new MinimumNetwork()
  const bdkPath = 'test/bdk'

  before(async function () {
    await minimumNetwork.createNetwork()
  })

  after(async () => {
    // Delete all backup files
    fs.rmSync(resolve(`${bdkPath}/backup`), { recursive: true })
    await minimumNetwork.deleteNetwork()
  })

  // create a new backup instance
  describe('Fabric.Backup.exportAll', () => {
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

  describe('Fabric.Backup.getExportItems', () => {
    it('should return a list of export items', () => {
      const exportItems = backup.getExportItems()
      assert(Array.isArray(exportItems), 'Export items are not an array')
      assert(exportItems.length > 0, 'No export items found')
    })
  })

  describe('Fabric.Backup.getBackupItems', () => {
    it('should return a list of backup items', () => {
      const backupItems = backup.getBackupItems()
      assert(Array.isArray(backupItems), 'Backup items are not an array')
      assert(backupItems.length > 0, 'No backup items found')
    })
  })

  describe('Fabric.Backup.createNetworkFolder', () => {
    before(() => {
      (new Config(config)).init()
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      fs.rmSync(`${config.infraConfig.bdkPath}/${config.networkName}`, { recursive: true })
    })

    it('should exist network folder in specified path', () => {
      backup.createNetworkFolder()
      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}`), true)
    })
  })

  describe('Fabric.Backup.import', () => {
    it('should exist network folder in specified path', () => {
      backup.createNetworkFolder()
      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/${config.networkName}`), true)
    })

    it('should import a backup tarball', async () => {
      fs.rmSync(resolve(`${bdkPath}/bdk-fabric-network`), { recursive: true })
      fs.mkdirSync(resolve(`${bdkPath}/bdk-fabric-network`))
      await sleep(500)

      const backupItems = backup.getBackupItems()
      const backupItem = backupItems[0] // Choose any backup item for import
      backup.import(backupItem.value)
      await sleep(500)

      assert(fs.readdirSync(resolve(`${bdkPath}/bdk-fabric-network`)).length > 0, 'No files found in bdk-fabric-network folder')
    })

    it('should have error when tarball error', async () => {
      const stub = sinon.stub(tar, 'x').throws(new BackupError('tarball error'))
      const backupItems = backup.getBackupItems()
      await assert.rejects(async () => { await backup.import(backupItems[0].value) }, BackupError)
      stub.restore()
    })
  })
})
