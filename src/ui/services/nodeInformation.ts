import { NodeDetails } from '../models/type/ui.type'
import axios from 'axios'

export class NodeInformationService {
  private apiUrl: string

  constructor (apiUrl: string) {
    this.apiUrl = apiUrl
  }

  public async getBlocks (block: any) {
    try {
      const response = await axios.post(this.apiUrl, block)
      return response.data.result
    } catch (error) {
    }
  }

  public async getPeers (peer: any) {
    try {
      const response = await axios.post(this.apiUrl, peer)
      return response.data.result
    } catch (error) {
    }
  }

  public async getNodeDetails (details: any): Promise<NodeDetails> {
    const response = await axios.post(this.apiUrl, details)
    return response.data.result as NodeDetails
  }

  public async getNodePeers (peerInfo: any): Promise<any> {
    try {
      const response = await axios.post(this.apiUrl, peerInfo)
      return response.data.result
    } catch (error) {
    }
  }
}
