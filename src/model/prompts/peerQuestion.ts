import prompts from 'prompts'
import { onCancel } from '../../util'
import { NetworkCreatePeerOrgType, NetworkPeerPortType } from '../type/network.type'

export const peerQuestions = async (count: number): Promise<NetworkCreatePeerOrgType> => {
  // const networkCreatePeerOrg: NetworkCreatePeerOrg = {}
  const { name } = await prompts([
    {
      type: 'text',
      name: 'name',
      message: `What is peer org ${count} name?`,
      initial: `Org${count + 1}`,
    },
  ], { onCancel })
  const { domain, enableNodeOUs, peerCount, userCount } = await prompts([
    {
      type: 'text',
      name: 'domain',
      message: `What is peer org ${name} domain?`,
      initial: `${(name as string).toLowerCase()}.example.com`,
    },
    {
      type: 'select',
      name: 'enableNodeOUs',
      message: `Does peer org ${name} enable nodeOUs`,
      choices: [
        {
          title: 'True',
          value: true,
        },
        {
          title: 'False',
          value: false,
        },
      ],
      initial: 0,
    },
    {
      type: 'number',
      name: 'peerCount',
      message: `What is peer count in peer org ${name}`,
      min: 1,
      initial: 1,
    },
    {
      type: 'number',
      name: 'userCount',
      message: `What is user count in peer org ${name}`,
      min: 1,
      initial: 1,
    },
  ], { onCancel })

  const ports: NetworkPeerPortType[] = []
  for (let i = 0; i < peerCount; i++) {
    ports.push(await prompts([
      {
        type: 'number',
        name: 'port',
        message: `What is the port of peer${i} of peer org${name}?`,
        initial: 7051,
      },
      {
        type: 'select',
        name: 'isPublishPort',
        message: `Does peer${i} of peer org${name} publish port?`,
        choices: [
          {
            title: 'True',
            value: true,
          },
          {
            title: 'False',
            value: false,
          },
        ],
        initial: i === 0 ? 0 : 1,
      },
      {
        type: 'number',
        name: 'operationPort',
        message: `What is the operation port of peer${i} of peer org${name}?`,
        initial: 9443,
      },
      {
        type: 'select',
        name: 'isPublishOperationPort',
        message: `Does peer${i} of peer org${name} publish operation port?`,
        choices: [
          {
            title: 'True',
            value: true,
          },
          {
            title: 'False',
            value: false,
          },
        ],
        initial: i === 0 ? 0 : 1,
      },
    ], { onCancel }))
  }

  return { name, domain, enableNodeOUs, peerCount, userCount, ports }
}
