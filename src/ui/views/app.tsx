import React, { useState } from 'react'
import { Box, Text, useApp, useInput, useStdin } from 'ink'
import Logo from './logo'
import Command from './command'
import DockerLogs from './dockerLogs'
import Terminal from './terminal'
import SelectInput from 'ink-select-input'

export default function App () {
  const { exit } = useApp()
  const [type, setType] = useState('Fabric')
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c') || key.escape) {
      exit()
    }
  })
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
  const selectChain = (item:any) => {
    setType(item.label)
  }

  return (
    <Box borderStyle='single' flexDirection='column' height={50}>
      <Box flexDirection='row' height={90}>
        <Box flexDirection='column' flexGrow={1}>
          <Logo />
          <Command />
          <SelectInput items={items} onHighlight={selectChain}/>
          <DockerLogs />
        </Box>
        <Box flexGrow={1}>
          <Terminal type={type}/>
        </Box>
      </Box>
      <Box flexDirection='column'>
      </Box>
      <Text bold={true} color='yellow'>-- Press q to exit --</Text>
    </Box>
  )
}
