import React, { useState, useMemo } from 'react'
import { Text, Box } from 'ink'
import CommandContext from '../services/commandContext'

interface TerminalProps {
  type: string
}

export default function Terminal (props: TerminalProps) {
  const commandContext = new CommandContext()
  const [output, setOutput] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useMemo(() => {
    let isCancelled = false

    const fetchCommandHelp = async () => {
      setLoading(true)

      try {
        const result = await commandContext.getCommandHelp(props.type)
        if (!isCancelled) {
          setOutput(result)
        }
      } catch (error) {
        console.error(`Error fetching command help: ${error}`)
      }

      setLoading(false)
    }

    setOutput('')
    fetchCommandHelp().catch((error) => {
      console.error(`Error fetching command help: ${error}`)
    })

    return () => {
      isCancelled = true
    }
  }, [props.type])

  return (
    <Box width={125} height={16} marginBottom={2} paddingBottom={2} flexDirection="column">
      <Text>Command output:</Text>
      <Box marginTop={1}>
        {loading ? (
          <></>
        ) : (
          <Text wrap="truncate-end">
            {output}
          </Text>
        )}
      </Box>
    </Box>
  )
}
