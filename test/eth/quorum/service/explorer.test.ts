/* global describe, it */
import Dockerode from 'dockerode'
import assert from 'assert'
import Network from '../../../../src/eth/service/network'
import Explorer from '../../../../src/eth/service/explorer'
import config from '../../../../src/eth/config'
import { ExplorerCreateType } from '../../../../src/eth/model/type/explorer.type'

describe('Quorum.Explorer.Service', function () {
  this.timeout(600000)

  const docker: Dockerode = new Dockerode({ socketPath: '/var/run/docker.sock' })
  const dockerdOption = { all: true }
  const network = new Network(config, 'quorum')
  const explorer = new Explorer(config, 'quorum')
  const explorerCreateOptions: ExplorerCreateType = {
    httpModeEnabled: false,
    nodeName: 'validator0',
    port: 9000,
    networkType: 'quorum',
  }

  describe('Quorum.Explorer.create', () => {
    it('should create and start the explorer', async () => {
      const initContainers = await docker.listContainers(dockerdOption)
      await network.createBdkFolder()
      await explorer.create(explorerCreateOptions)
      const upContainers = await docker.listContainers(dockerdOption)

      assert.strictEqual(upContainers.length, initContainers.length + 2)
      const explorerContainer = upContainers.find(container => container.Names.some(name => name.includes('blockscout')))

      const containerInfo = await docker.getContainer(explorerContainer?.Id as string).inspect()
      assert.strictEqual(containerInfo.State.Status as string, 'running', 'Container is not running')
    })
  })

  describe('Quorum.Explorer.getExplorerFiles', () => {
    // Populate the files as needed for testing purposes
    it('should return a list of explorer files', () => {
      const explorerFiles = explorer.getExplorerFiles()
      assert(Array.isArray(explorerFiles))
      assert.strictEqual(explorerFiles[0], 'explorer-docker-compose.yaml')
    })
  })

  describe('Quorum.Explorer.delete', () => {
    it('should delete the explorer', async () => {
      await explorer.delete()

      const containers = await docker.listContainers(dockerdOption)
      const explorerContainer = containers.find(container => container.Names.some(name => name.includes('blockscout')))

      assert(!explorerContainer)
    })
  })
})
