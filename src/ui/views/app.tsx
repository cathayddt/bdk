import React, { useState, useEffect, lazy, Suspense } from 'react'
import { Box, Text, useApp, useInput, useStdout } from 'ink'
import Logo from '../components/logo'
import DockerLogs from '../components/dockerlogs'
import Select from '../components/selectInput'

const Terminal = lazy(() => import('../components/terminal'))

export default function App () {
  const { exit } = useApp()

  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c') || key.escape) {
      exit()
    }
  })

  const { stdout }: any = useStdout()
  const [width, setWidth] = useState(stdout.columns || 80)
  const [height, setHeight] = useState(stdout.rows || 24)
  const [, setWindowSize] = useState({
    columns: process.stdout.columns,
    rows: process.stdout.rows,
  })

  useEffect(() => {
    const handleResize = () => {
      setWidth(stdout.columns)
      setHeight(stdout.rows)
    }

    process.stdout.on('resize', handleResize)
    return () => {
      process.stdout.off('resize', handleResize)
    }
  }, [stdout.columns, stdout.rows])

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        columns: process.stdout.columns,
        rows: process.stdout.rows,
      })
    }

    process.stdout.on('resize', handleResize)

    return () => {
      process.stdout.off('resize', handleResize)
    }
  }, [])

  const [networkType, setNetworkType] = useState('bdk fabric')

  return (
    <Box flexDirection='row' width={width} height={height}>
      <Suspense fallback={<Text>Loading ....</Text>}>
        <Box width="45%" borderStyle='single' flexDirection='column' borderColor={'white'}>
          <Terminal type={networkType} />
          <Box height="5%" marginTop={30} paddingTop={1} flexDirection='row' justifyContent='space-between'>
            <Text color={'yellow'}>Press q to exit</Text>
          </Box>
        </Box>
      </Suspense>
      <Box width="55%" flexDirection='column'>
        <Box height="30%" flexDirection='row'>
          <Select setNetworkType={setNetworkType} />
          <Logo />
        </Box>
        <Box height="70%" borderStyle='bold' borderColor={'white'} flexDirection='column'>
          <Box height="10%" borderColor={'white'} borderStyle='bold' justifyContent='center'>
            <Text color={'white'}>Running Docker Container</Text>
          </Box>
          <Box height="90%">
            <DockerLogs />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
