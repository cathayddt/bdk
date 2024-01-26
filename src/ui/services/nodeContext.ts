import fs from 'fs-extra'
import { NodeDetails, PeerInformation } from '../models/type/ui.type'
import axios from 'axios'

export class NodeContextService {
  private apiUrl: string
  private bdkPath: string
  constructor (apiUrl: string) {
    this.apiUrl = apiUrl
    this.bdkPath = process.env.BDK_PATH || `${process.env.HOME}/.bdk/quorum`
  }

  public getNodeList () {
    const nodeList = fs.readFileSync(`${this.bdkPath}/nodelist.json`, 'utf-8')
    return JSON.parse(nodeList)
  }

  public async getBlocks () {
    try {
      const response = await axios.post(
        this.apiUrl,
        this.makeJsonRpcParam('eth_blockNumber'),
      )
      let blockcount = 0
      blockcount = parseInt(response.data.result, 16)
      return blockcount
    } catch (error) {
      return 0
    }
  }

  public async getPeers () {
    try {
      const response = await axios.post(
        this.apiUrl,
        this.makeJsonRpcParam('net_peerCount'),
      )
      let peercount = 0
      peercount = parseInt(response.data.result, 16)
      return peercount
    } catch (error) {
      return 0
    }
  }

  public async getNodeDetails (): Promise<NodeDetails> {
    try {
      const response = await axios.post(
        this.apiUrl,
        this.makeJsonRpcParam('admin_nodeInfo'),
      )
      return response.data.result as NodeDetails
    } catch (error) {
      return { id: 'NaN', name: 'NaN', enode: 'NaN', ip: 'NaN' }
    }
  }

  public async getNodePeers (): Promise<PeerInformation[]> {
    try {
      const response = await axios.post(
        this.apiUrl,
        this.makeJsonRpcParam('admin_peers'),
      )
      return response.data.result
    } catch (error) {
      return [{
        id: 'NaN',
        enode: 'NaN',
        name: 'NaN',
        network: {
          localAddress: 'NaN',
          remoteAddress: 'NaN',
        },
      }]
    }
  }

  private makeJsonRpcParam (method: string, id = 1) {
    return {
      jsonrpc: '2.0',
      method: method,
      params: [],
      id: id,
    }
  }
}
