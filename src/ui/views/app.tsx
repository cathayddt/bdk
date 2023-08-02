import React, { useState } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import Logo from './logo'
import Command from './command'
import DockerLogs from './dockerLogs'
import Terminal from './terminal'
import SelectInput from 'ink-select-input'
import CommandContext from '../services/commandContext'

export default function App () {
  const { exit } = useApp()
  const commandContext = new CommandContext()
  const [type, setType] = useState('bdk fabric')
  const [items, setItems] = useState([
    {
      label: 'Fabric',
      value: 'bdk fabric',
    },
    {
      label: 'Quorum',
      value: 'bdk quorum',
    },
  ])
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c') || key.escape) {
      exit()
    }
  })

  const selectChain = (item:any) => {
    setType(item.value)
  }

  const handleCommand = (item: any) => {
    const commandList = commandContext.makeItem(item.value)
    if (commandList.length === 0) {
      commandContext.executeCommand(item.value)
    } else setItems(commandList)
  }

  return (
    <Box borderStyle='single' flexDirection='column' height={50}>
      <Box flexDirection='row' height={90}>
        <Box flexDirection='column' width="50%">
          <Logo />
          <Command />
          <SelectInput items={items} onHighlight={selectChain} onSelect={handleCommand}/>
          <DockerLogs />
        </Box>
        <Box width="50%">
          <Terminal type={type}/>
        </Box>
      </Box>
      <Box flexDirection='column'>
      </Box>
      <Text bold={true} color='yellow'>-- Press q to exit --</Text>
    </Box>
  )
}
