import React from 'react'
import { Text, Box, Newline } from 'ink'
import QuorumCommands from '../services/commandContext'

export default function Command () {
  const quorum = new QuorumCommands()
  const [output, setOutput] = React.useState('')
  React.useEffect(() => {
    setOutput(quorum.getCommandContext('bdk quorum').toString())
  }, [setOutput])

  return (
    <Box>
      <Text>Choose a command:</Text>
      <Newline />
      <Box flexDirection="column">
        <Text> Quorum: {output}</Text>
      </Box>
    </Box>
  )
}
