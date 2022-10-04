export const testNetworkConfig = {
  ordererOrgs: [
    {
      name: 'Orderer',
      domain: 'orderer.example.com',
      enableNodeOUs: true,
      hostname: [
        'orderer',
      ],
      ports: [
        {
          port: 7050,
          isPublishPort: true,
          operationPort: 8443,
          isPublishOperationPort: true,
        },
      ],
    },
  ],
  peerOrgs: [
    {
      name: 'Org1',
      domain: 'org1.example.com',
      enableNodeOUs: true,
      peerCount: 1,
      userCount: 1,
      ports: [
        {
          port: 7051,
          isPublishPort: true,
          operationPort: 9443,
          isPublishOperationPort: true,
        },
      ],
    },
    {
      name: 'Org2',
      domain: 'org2.example.com',
      enableNodeOUs: true,
      peerCount: 1,
      userCount: 1,
      ports: [
        {
          port: 8051,
          isPublishPort: true,
          operationPort: 10443,
          isPublishOperationPort: true,
        },
      ],
    },
  ],
}
