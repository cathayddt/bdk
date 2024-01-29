import React, { useState, useEffect, useLayoutEffect, memo } from 'react'
import { Box, Text, Newline } from 'ink'
import { NodeContextService } from '../services/nodeContext'
import { debounce } from '../../util'

const NodeStatus = memo(function NodeStatus (props: any) {
  const apiUrl = props.apiUrl
  const nodeInformationService = new NodeContextService(apiUrl)
  const [state, setState] = useState<string>('shutdown')
  const [stateColor, setStateColor] = useState<string>('#FF000F')
  const [block, setBlock] = useState<number>(0)
  const [peer, setPeer] = useState<number>(0)

  const fetchData = async () => {
    const res = await nodeInformationService.getBlocks()
    setBlock(res)
  }

  const fetchPeerData = async () => {
    const res = await nodeInformationService.getPeers()
    setPeer(res)
  }

  const debouncedFetchData = debounce(fetchData, 2500)
  const debouncedFetchPeerData = debounce(fetchPeerData, 2500)

  useLayoutEffect(() => {
    const intervalId = setInterval(() => {
      debouncedFetchData()
      debouncedFetchPeerData()
    }, 2500)

    return () => clearInterval(intervalId)
  }, [apiUrl])

  useEffect(() => {
    if (block !== 0) {
      setState('running')
      setStateColor('#00FF19')
    } else {
      setState('shutdown')
      setStateColor('#FF000F')
    }
  }, [block, peer])

  return (
    <Box width='20%' flexDirection='column' borderStyle='bold' borderColor='white' padding={2}>
      <Text color={'blue'}>Node Status</Text>
      <Newline />
      <Text color={stateColor}>Status: {state}</Text>
      <Newline />
      <Text color={'#FF0099'}>Blocks: {block}</Text>
      <Newline />
      <Text color={'cyan'}>Peers: {peer}</Text>
      <Newline />
    </Box>
  )
},
)
export default NodeStatus
