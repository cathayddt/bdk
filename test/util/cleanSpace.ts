import Dockerode from 'dockerode'
export default async function (docker: Dockerode) {
  const dockerdOption = { all: true }
  const containers = await docker.listContainers(dockerdOption)
  // stop and remove all containers
  for (let i = 0; i < containers.length; i++) {
    const containerInfo = containers[i]
    try {
      const container = docker.getContainer(containerInfo.Id)
      await container.remove({ force: true, v: true })
    } catch (e) {
      // console.log("clean up failed ")
      // console.log(e.message)
    }
  }
  // volume prune
  await docker.pruneVolumes()
  await docker.pruneNetworks()
}
