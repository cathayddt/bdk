import React from 'react'
import { Text, Box } from 'ink'
import { execSync } from 'child_process'

export default function Terminal () {
  const [output, setOutput] = React.useState('')
  React.useEffect(() => {
    setOutput(execSync('bdk fabric --help').toString())
  }, [setOutput])

  return (
    <Box borderStyle="single" flexDirection="column" flexGrow={1}>
      <Text>Command output:</Text>
      <Box marginTop={1}>
        <Text>{output}</Text>
      </Box>
    </Box>
  )
}
