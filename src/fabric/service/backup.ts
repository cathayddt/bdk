import { AbstractService } from './Service.abstract'
import tar from 'tar'
import fs from 'fs'
import { BackupError, tarDateFormat } from '../../util'

export default class Backup extends AbstractService {
  /**
   * @description 匯出 fabric network 備份資料
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
   * @description 匯出 fabric network 單一 peer or orderer 備份資料
   */
  public export (nodeName: string[]) {
    const bdkPath = this.bdkFile.getBdkPath()
    const createOpts = {
      gzip: true,
      cwd: bdkPath,
      sync: true,
    }

    if (nodeName[0].startsWith('peer')) {
      const peerFiles = [
        'channel-artifacts',
        'config-yaml',
        'tlsca',
        'org-json',
        ...nodeName.map((peer) => `docker-compose/docker-compose-peer-${peer}.yaml`),
        ...nodeName.map((peer) => `env/peer-${peer}.env`),
        'peerOrganizations',
        'ordererOrganizations',
      ]

      try {
        tar
          .c(createOpts, peerFiles)
          .pipe(this.bdkFile.createBackupTar(`${nodeName}`, tarDateFormat(new Date())))
      } catch (e: any) {
        throw new BackupError(`[x] tar compress error: ${e.message}`)
      }
    } else if (nodeName[0].startsWith('orderer')) {
      const ordererFiles = [
        'channel-artifacts',
        'config-yaml',
        'tlsca',
        'org-json',
        ...nodeName.map((orderer) => `docker-compose/docker-compose-orderer-${orderer}.yaml`),
        ...nodeName.map((orderer) => `env/orderer-${orderer}.env`),
        'peerOrganizations',
        'ordererOrganizations',
      ]

      try {
        tar
          .c(createOpts, ordererFiles)
          .pipe(this.bdkFile.createBackupTar(`${nodeName}`, tarDateFormat(new Date())))
      } catch (e: any) {
        throw new BackupError(`[x] tar compress error: ${e.message}`)
      }
    } else {
      throw new BackupError('[x] tar compress error: nodeName error')
    }
  }

  /**
   * @description 回傳 backup 資料夾所有的備份檔案
   */
  public getExportItems () {
    const node = this.bdkFile.getExportFiles()
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
   * @description 建立 blockchain network 資料夾
   */
  public createNetworkFolder () {
    this.bdkFile.createNetworkFolder()
  }

  /**
   * @description 匯入 fabric network 備份資料
   */
  public import (tarFileName: string) {
    this.bdkFile.createNetworkFolder()
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

  /** @ignore */
  public getDockerComposeList () {
    const fileNames = this.bdkFile.getDockerComposeList()
    return fileNames
  }
}
