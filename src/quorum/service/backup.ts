import { AbstractService } from './Service.abstract'
import tar from 'tar'
import fs from 'fs'
import { BackupError, tarDateFormat } from '../../util'

export default class Backup extends AbstractService {
  /**
   * @description 匯出 quorum network 備份資料
   */
  public exportAll () {
    const bdkPath = this.bdkFile.getBdkPath()
    const createOpts = {
      gzip: true,
      cwd: bdkPath,
      sync: true,
    }
    try {
      tar
        .c(createOpts, fs.readdirSync(bdkPath))
        .pipe(this.bdkFile.createBackupTar('All', tarDateFormat(new Date())))
    } catch (e: any) {
      throw new BackupError(`[x] tar error: ${e.message}`)
    }
  }

  /**
   * @description 匯出 quorum network 單一 node 備份資料
   */
  public export (nodeName: string) {
    const bdkPath = this.bdkFile.getBdkPath()
    const createOpts = {
      gzip: true,
      cwd: bdkPath,
      sync: true,
    }
    const dockerCompose = (nodeName.match(/(validator)[0-9]+/g))
      ? 'validator-docker-compose.yaml'
      : 'member-docker-compose.yaml'

    try {
      tar
        .c(createOpts, [`${nodeName}`,
          'artifacts',
          dockerCompose])
        .pipe(this.bdkFile.createBackupTar(`${nodeName}`, tarDateFormat(new Date())))
    } catch (e: any) {
      throw new BackupError(`[x] tar compress error: ${e.message}`)
    }
  }

  /**
   * @description 回傳 backup 資料夾所有的備份檔案
   */
  public getExportItems () {
    const node = this.bdkFile.getExportFiles().filter(file => file.match(/(validator|member)[0-9]+/g))
    const nodeList = node.map(x => ({ title: x, value: x }))
    return nodeList
  }

  /**
   * @description 回傳 backup 資料夾所有的備份檔案
   */
  public getBackupItems () {
    const archive = this.bdkFile.getBackupFiles().filter(file => file.match(/[\w-]+\.tar/g))
    const archiveList = archive.map(x => ({ title: x, value: x }))
    return archiveList
  }

  /**
   * @description 匯入 quorum network 備份資料
   */
  public import (tarFileName: string) {
    const bdkPath = this.bdkFile.getBdkPath()
    const backupPath = this.bdkFile.getBackupPath()
    try {
      fs.createReadStream(`${backupPath}/${tarFileName}`).pipe(
        tar.x({
          cwd: bdkPath,
        }),
      )
    } catch (e: any) {
      throw new BackupError(`[x] tar extract error: ${e.message}`)
    }
  }
}
