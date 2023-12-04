import React, { useState, useMemo, useEffect } from 'react'
import { Text, Box, Newline } from 'ink'
import ContainerContext from '../services/containerContext'
import { ContainerListProps } from '../models/type/ui.type'

export default function DockerLogs () {
  const containerContext = new ContainerContext()
  const [containers, setContainers] = useState<ContainerListProps[]>([])

  useEffect(() => {
    const fetchContainers = async () => {
      try {
        const result = await containerContext.getContainers()
        if (result !== containers) setContainers(result)
      } catch (error) {
        console.error(`Error fetching containers: ${error}`)
      }
    }

    const interval = setInterval(fetchContainers, 3000)
    return () => {
      clearInterval(interval)
    }
  }, [containers])

  const memoizedContainers = useMemo(() => containers, [containers])

  return (
    <Box flexDirection="column">
      {memoizedContainers.map((container: any) => {
        const statusColor = container.state === 'running' ? 'green' : 'red'
        return (
          <Box key={container.id} flexDirection="column">
            <Box flexDirection="row">
              <Text color={statusColor}>State: {container.state}</Text>
              <Text> </Text>
              <Text bold>Container ID: {container.id}</Text>
            </Box>
            <Box flexDirection="row">
              <Text>Name: {container.names.join(', ')}</Text>
              <Text> </Text>
              <Text>Image: {container.image}</Text>
            </Box>
            <Newline/>
          </Box>
        )
      })}
    </Box>
  )
}
