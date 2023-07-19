import React from 'react'
import { Text, Box } from 'ink'

const items = [
  {
    label: 'Fabric',
    value: 'bdk fabric',
  },
  {
    label: 'Quorum',
    value: 'bdk quorum',
  },
]
export default function DockerLogs () {
  return (
    <Box borderStyle='single' flexDirection='column'>
      <Text>Blockchain Platform：</Text>
      <Box flexDirection='column'>
        {items.map((item) => (
          <Box key={item.value}>
            <Text>{item.label}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
