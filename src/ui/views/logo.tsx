import React from 'react'
import { Text, Box } from 'ink'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Gradient from 'ink-gradient'

export default function Logo () {
  return (
    <Box borderStyle='single' flexDirection='column'>
      <Gradient name="rainbow">
        <Text>
          Blockchain Deploy Kit
        </Text>
      </Gradient>
    </Box>
  )
}
