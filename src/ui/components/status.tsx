import React, { useState, useEffect, useLayoutEffect, memo } from 'react'
import { Box, Text, Newline } from 'ink'
import { NodeInformationService } from '../services/nodeInformation'
import { debounce } from '../../util'

const NodeStatus = memo(function NodeStatus (props: any) {
  const apiUrl = props.apiUrl
  const nodeInformationService = new NodeInformationService(apiUrl)
  const [state, setState] = useState<string>('shutdown')
  const [stateColor, setStateColor] = useState<string>('#FF000F')
  const [block, setBlock] = useState<string>('')
  const [peer, setPeer] = useState<string>('')
  const [retryCount, setRetryCount] = useState(0)

  const fetchData = async () => {
    try {
      await nodeInformationService.getBlocks({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }).then(res => {
        const blockcount: any = parseInt(res, 16)
        setBlock(blockcount)
      },
      )
    } catch (error) {
      setRetryCount(retryCount + 1)
    }
  }

  const fetchPeerData = async () => {
    try {
      await nodeInformationService.getPeers({
        jsonrpc: '2.0',
        method: 'net_peerCount',
        params: [],
        id: 1,
      }).then(res => {
        const peerCounts: any = parseInt(res, 16)
        setPeer(peerCounts)
      })
    } catch (error) {
    }
  }

  const debouncedFetchData = debounce(fetchData, 2500)
  const debouncedFetchPeerData = debounce(fetchPeerData, 2500)

  useLayoutEffect(() => {
    const intervalId = setInterval(() => {
      debouncedFetchData()
      debouncedFetchPeerData()
    }, 2500)

    return () => clearInterval(intervalId)
  }, [retryCount, apiUrl])

  useEffect(() => {
    const isNumeric = /^[0-9]+$/.test(block)
    if (isNumeric && block !== '') {
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
