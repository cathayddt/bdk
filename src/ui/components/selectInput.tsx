import React, { useState } from 'react'
import { Text, Box } from 'ink'
import SelectInput from 'ink-select-input'
import CommandContext from '../services/commandContext'

export default function Select ({ setNetworkType }: any) {
  const commandContext = new CommandContext()

  const [isCommandExecuting, setIsCommandExecuting] = useState(false)
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

  const selectChain = (item: any) => {
    setNetworkType(item.value)
  }

  const handleCommand = async (item: any) => {
    if (isCommandExecuting) return
    setIsCommandExecuting(true)
    await new Promise(resolve => setImmediate(resolve))

    const commandList = await commandContext.makeItem(item.value)
    if (commandList.length === 0) {
      await commandContext.executeCommand(item.value)
    } else setItems(commandList)
    setIsCommandExecuting(false)
  }

  return (
    <>
      <Box width={50} height={16} marginBottom={2} borderStyle='single' borderColor="#FFFFFF" flexDirection='column'>
        <Text color={'white'} bold>Choose a type of network to deploy:</Text>
        <Box marginTop={1}>
          <SelectInput items={items} onHighlight={selectChain} onSelect={handleCommand} />
        </Box>
      </Box>
    </>
  )
}
