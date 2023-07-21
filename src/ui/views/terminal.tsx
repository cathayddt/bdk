import React from 'react'
import { Text, Box } from 'ink'
import { execSync } from 'child_process'
interface TerminalProps {
  type: string
}
export default function Terminal (props: TerminalProps) {
  const [output, setOutput] = React.useState('')
  React.useEffect(() => {
    if (props.type === 'Fabric') {
      setOutput(execSync('bdk fabric --help').toString())
    }
    if (props.type === 'Quorum') {
      setOutput(execSync('bdk quorum --help').toString())
    }
  }, [props.type])

  return (
    <Box borderStyle="single" flexDirection="column" flexGrow={1}>
      <Text>Command output:</Text>
      <Box marginTop={1}>
        <Text>{output}</Text>
      </Box>
    </Box>
  )
}
