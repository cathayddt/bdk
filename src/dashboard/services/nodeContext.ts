import fs from 'fs-extra'
import { NodeDetails, PeerInformation } from '../models/type/dashboard.type'
import axios from 'axios'

export class NodeContextService {
  private apiUrl: string
  private bdkPath: string
  constructor (apiUrl: string) {
    this.apiUrl = apiUrl
    this.bdkPath = process.env.BDK_PATH || `${process.env.HOME}/.bdk/quorum/bdk-quorum-network`
  }

  public getNodeList () {
    const nodeList = fs.readFileSync(`${this.bdkPath}/network-info.json`, 'utf-8')
    return JSON.parse(nodeList)
  }

  public async getBlocks () {
    try {
      const response = await axios.post(
        this.apiUrl,
        this.makeJsonRpcParam('eth_blockNumber'),
      )
      const blockNumberHex = response.data.result
      return parseInt(blockNumberHex, 16)
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
      const peerCountHex = response.data.result
      return parseInt(peerCountHex, 16)
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
