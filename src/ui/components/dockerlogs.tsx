import React, { useState, useEffect } from 'react'
import { Text, Box } from 'ink'
import Docker from 'dockerode'

export default function DockerLogs () {
  const docker = new Docker()
  const [containers, setContainers] = useState([])

  const listContainers = () => {
    docker.listContainers({ all: true }, (err: any, containerList: any) => {
      if (err) {
        console.error('Error:', err)
      } else {
        setContainers(containerList)
      }
    })
  }

  useEffect(() => {
    listContainers()

    // renew state every 10 seconds
    const interval = setInterval(listContainers, 10000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <Box flexDirection="column">
      {containers.map((container: any) => (
        <Box key={container.Id} flexDirection="column">
          <Text bold>Container ID: {container.Id}</Text>
          <Text>Image: {container.Image}</Text>
          <Text>Name: {container.Names.join(', ')}</Text>
          <Text>Status: {container.Status}</Text>
          {/* <Text>Ports: {container.Ports.map((port:any) => `${port.PrivatePort}:${port.PublicPort}`).join(', ')}</Text> */}
        </Box>
      ))}
    </Box>
  )
}
