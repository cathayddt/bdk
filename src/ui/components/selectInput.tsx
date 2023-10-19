/* eslint-disable react/react-in-jsx-scope */
import { useState } from 'react'
import { Text, Box } from 'ink'
import SelectInput from 'ink-select-input'
import CommandContext from '../services/commandContext'

export default function Select ({ setNetworkType }:any) {
  const commandContext = new CommandContext()

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

  const handleCommand = (item: any) => {
    const commandList = commandContext.makeItem(item.value)
    if (commandList.length === 0) {
      commandContext.executeCommand(item.value)
    } else setItems(commandList)
  }

  return (
    <>
      <Box width={50} height={16} marginBottom={2} borderStyle='single' borderColor="#FFFFFF" flexDirection='column'>

        <Text color={'white'} bold>Choose a type of network to deploy:</Text>
        <Box marginTop={1}>
          <SelectInput items={items} onHighlight={selectChain} onSelect={handleCommand}/>
        </Box>
      </Box>
    </>
  )
}
