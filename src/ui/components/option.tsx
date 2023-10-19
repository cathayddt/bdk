import React from 'react'
import { Box } from 'ink'
import Terminal from './terminal'

export default function Option ({ networkType }: any) {
  return (
    <>
      <Box width={125} height={16} marginBottom={2} paddingBottom={2} flexDirection="column" >
        <Terminal type={networkType} />
      </Box>
    </>
  )
}
