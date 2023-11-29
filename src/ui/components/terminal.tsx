import React, { useState, useEffect } from 'react'
import { Text, Box } from 'ink'
import CommandContext from '../services/commandContext'
interface TerminalProps {
  type: string
}
export default function Terminal (props: TerminalProps) {
  const commandContext = new CommandContext()
  const [output, setOutput] = useState('')
  useEffect(() => {
    const fetchCommandHelp = async () => {
      const result = await commandContext.getCommandHelp(props.type)
      setOutput(result)
    }
    fetchCommandHelp().catch((err) => {
      console.log(err)
    })
  }, [props.type])

  return (
    <>
      <Text>Command output:</Text>
      <Box marginTop={1}>
        <Text wrap="truncate-end">{output}</Text>
      </Box>
    </>
  )
}
