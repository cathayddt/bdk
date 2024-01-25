import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { NodeInformationService } from '../services/nodeInformation'

const PeerInfo = (props: any) => {
  const apiUrl = props.apiUrl
  const nodeInformationService = new NodeInformationService(apiUrl)
  const [jsonData, setJsonData] = useState<any[]>([])
  const [retryCount, setRetryCount] = useState(0)

  const fetchData = async () => {
    try {
      await nodeInformationService.getNodePeers({
        jsonrpc: '2.0',
        method: 'admin_peers',
        params: [],
        id: 1,
      }).then(res => {
        if (typeof (res) === 'undefined') {
          setJsonData([])
        } else {
          setJsonData(res)
        }
      },
      )
    } catch (error) {
      setRetryCount(retryCount + 1)
    }
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData()
        .then((response) => { return response })
        .catch((error) => { return error })
    }, 2500)

    return () => clearInterval(intervalId)
  }, [retryCount, apiUrl])

  if (jsonData.length > 0) {
    return (
      <Box height='65%' flexDirection='column' borderStyle='bold' borderColor='white'>
        <Box height='10%' justifyContent='center'>
          <Text color={'white'} bold>Peer Information</Text>
        </Box>
        <Box height='90%' flexDirection='column'>
          { jsonData.map((item: any, index: number) => {
            return (
              <Box key={index} flexDirection='row' marginBottom={1} marginX={2} paddingLeft={3}>
                <Text color={'#00FF19'}>ID: {item.id}</Text>
                <Text>     </Text>
                <Text color={'white'}>E-Node: {item.enode}</Text>
                <Text>     </Text>
                <Text color={'white'}>Local Address: {item.network.localAddress}</Text>
                <Text>     </Text>
                <Text color={'white'}>Remote Address: {item.network.remoteAddress}</Text>
              </Box>
            )
          },
          )}
        </Box>
      </Box>
    )
  } else {
    return (
      <Box height='65%' flexDirection='column' borderStyle='bold' borderColor='white'>
        <Text color={'white'}>loading....</Text>
      </Box>
    )
  }
}

export default PeerInfo
