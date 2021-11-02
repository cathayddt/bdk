import prompts from 'prompts'
import { onCancel } from '../../util'
import { NetworkCreateOrdererOrgType, NetworkOrdererPortType } from '../type/network.type'

export const ordererQuestions = async (count: number): Promise<NetworkCreateOrdererOrgType> => {
  // const networkCreatePeerOrg: NetworkCreatePeerOrg = {}
  const { name } = await prompts([
    {
      type: 'text',
      name: 'name',
      message: `What is orderer org ${count} name?`,
      initial: `Org${count + 1}Orderer`,
    },
  ], { onCancel })
  const { domain, enableNodeOUs, hostname } = await prompts([
    {
      type: 'text',
      name: 'domain',
      message: `What is orderer org ${name} domain name?`,
      initial: `${(name as string).toLowerCase()}.example.com`,
    },
    {
      type: 'select',
      name: 'enableNodeOUs',
      message: `Does orderer org ${name} enable NodeOUs`,
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
      type: 'list',
      name: 'hostname',
      message: `What is orderer org ${name} all hostname?`,
      initial: 'orderer0',
    },
  ], { onCancel })

  const ports: NetworkOrdererPortType[] = []
  for (const i in hostname) {
    ports.push(await prompts([
      {
        type: 'number',
        name: 'port',
        message: `What is the port of ${hostname[i]} of orderer org ${name}?`,
        initial: 7050,
      },
      {
        type: 'select',
        name: 'isPublishPort',
        message: `Does ${hostname[i]} of orderer org ${name} publish port?`,
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
        initial: i === '0' ? 0 : 1,
      },
      {
        type: 'number',
        name: 'operationPort',
        message: `What is the operation port of ${hostname[i]} of orderer org ${name}?`,
        initial: 8443,
      },
      {
        type: 'select',
        name: 'isPublishOperationPort',
        message: `Does ${hostname[i]} of orderer org ${name} publish operation port?`,
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
        initial: i === '0' ? 0 : 1,
      },
    ], { onCancel }))
  }

  return { name, domain, enableNodeOUs, hostname, ports }
}
