import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { NodeContextService } from '../services/nodeContext'
import { PeerInformation } from '../models/type/ui.type'

export default function PeerInfo (props: any) {
  const apiUrl: string = props.apiUrl
  const nodeInformationService = new NodeContextService(apiUrl)
  const [jsonData, setJsonData] = useState<PeerInformation[]>([])

  const fetchData = async () => {
    const res: PeerInformation[] = await nodeInformationService.getNodePeers()
    setJsonData(res)
  }
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData()
        .then((response) => { return response })
        .catch((error) => { return error })
    }, 2500)

    return () => clearInterval(intervalId)
  }, [apiUrl, jsonData])

  return (
    <Box height='65%' flexDirection='column' borderStyle='bold' borderColor='white'>
      <Box height='10%' justifyContent='center'>
        <Text color={'white'} bold>Peer Information</Text>
      </Box>
      <Box height='90%' flexDirection='column'>
        { jsonData?.map((item: PeerInformation, index: number) => {
          return (
            <Box key={index} flexDirection='row' marginBottom={1} marginX={2} paddingLeft={3}>
              <Text color={'#00FF19'}>ID: {item.id}</Text>
              <Text>     </Text>
              <Text color={'white'}>E-Node: {item.enode}</Text>
              <Text>     </Text>
              <Text color={'white'}>Local Address: {item.network?.localAddress}</Text>
              <Text>     </Text>
              <Text color={'white'}>Remote Address: {item.network?.remoteAddress}</Text>
            </Box>
          )
        },
        )}
      </Box>
    </Box>
  )
}
