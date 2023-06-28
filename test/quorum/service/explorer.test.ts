/* global describe, it */
import Dockerode from 'dockerode'
import assert from 'assert'
import Network from '../../../src/quorum/service/network'
import Explorer from '../../../src/quorum/service/explorer'
import config from '../../../src/quorum/config'

describe('Quorum.Explorer.Service', function () {
  this.timeout(600000)

  const docker: Dockerode = new Dockerode({ socketPath: '/var/run/docker.sock' })
  const dockerdOption = { all: true }
  const network = new Network(config)
  const explorer = new Explorer(config)
  const port = 9000

  describe('Quorum.Explorer.create', () => {
    it('should create and start the explorer', async () => {
      const initContainers = await docker.listContainers(dockerdOption)
      await network.createBdkFolder()
      await explorer.create(port)
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
