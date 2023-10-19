import React from 'react'
import { Text, Box } from 'ink'
import CommandContext from '../services/commandContext'
interface TerminalProps {
  type: string
}
export default function Terminal (props: TerminalProps) {
  const commandContext = new CommandContext()
  const [output, setOutput] = React.useState('')
  React.useEffect(() => {
    setOutput(commandContext.getCommandHelp(props.type))
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
