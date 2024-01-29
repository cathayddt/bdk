import React, { useState, useEffect } from 'react'
import { Box, Newline, Text, useApp, useInput, useStdout } from 'ink'
import Logo from '../components/logo'
import SelectInput from 'ink-select-input'
import NodeStatus from '../components/status'
import NodeInfo from '../components/nodeInfo'
import PeerInfo from '../components/peerInfo'
import { NodeContextService } from '../services/nodeContext'
import { NodeListType } from '../models/type/dashboard.type'
import { debounce } from '../../util'

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

  const nodeService = new NodeContextService('http://localhost:8545')
  const NodeList = nodeService.getNodeList()

  const [nodeType, setNodeType] = useState<string>(NodeList[0].value)
  const [nodeName, setNodeName] = useState<string>(NodeList[0].label)
  const selectNode = debounce((item: NodeListType) => {
    setNodeType(item.value)
    setNodeName(item.label)
  }, 100)

  return (
    <Box flexDirection='column' width={width} height={height}>
      <Box height="35%" flexDirection='row'>
        <Box width="70%" flexDirection='row'>
          <Box width="30%" flexDirection='column' borderStyle='bold' borderColor='white' padding={2}>
            <Text color={'#42c5f5'}>Select Node: </Text>
            <Newline/>
            <SelectInput items={NodeList} onHighlight={selectNode} />
            <Newline/>
            <Text color={'#00FF19'}>Current node: {nodeName}  {nodeType}</Text>
          </Box>
          <NodeStatus apiUrl={nodeType} />
          <NodeInfo apiUrl={nodeType} />
        </Box>
        <Box width="30%" flexDirection='row'>
          <Logo />
        </Box>
      </Box>
      <PeerInfo apiUrl={nodeType} />
    </Box>
  )
}
