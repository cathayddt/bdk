import React from 'react'
import { Text, Box, useInput } from 'ink'
import ContainerContext from '../services/containerContext'

export default function DockerLogs () {
  const containerContext = new ContainerContext()
  const [items, setItems] = React.useState()
  React.useEffect(() => {
    setItems(containerContext.listContainers() as any)
  }, [setItems])

  useInput((input) => {
    if (input === 'r') {
      setItems(containerContext.listContainers() as any)
    }
  })
  return (
    <Box borderStyle='single' flexDirection='column'>
      <Text>Docker Containers: </Text>
      <Box flexDirection='column'>
        <Text>{ items }</Text>
      </Box>
    </Box>
  )
}
