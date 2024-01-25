import React, { useState, useEffect } from 'react'
import { Box, Text, Newline } from 'ink'
import { NodeDetails } from '../models/type/ui.type'
import { NodeInformationService } from '../services/nodeInformation'

export default function NodeInfo (props: any) {
  const apiUrl = props.apiUrl
  const nodeInformationService = new NodeInformationService(apiUrl)
  const [nodeInfo, setNodeInfo] = useState<NodeDetails>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        await nodeInformationService.getNodeDetails({
          jsonrpc: '2.0',
          method: 'admin_nodeInfo',
          params: [],
          id: 1,
        }).then(res => { setNodeInfo(res) })
      } catch (error) {
      }
    }
    fetchData()
      .then((response) => { return response })
      .catch((error) => { return error })
  }, [apiUrl])

  return (
    <Box width='50%' flexDirection='column' borderStyle='bold' borderColor='white' padding={1}>
      <Text color={'#00FF19'}>Node ID: {nodeInfo?.id}</Text>
      <Newline />
      <Text color={'white'}>Node Name: {nodeInfo?.name}</Text>
      <Newline />
      <Text color={'white'}>Enode: {nodeInfo?.enode}</Text>
      <Newline />
      <Text color={'white'}>IP Address: {nodeInfo?.ip}</Text>
    </Box>
  )
}
