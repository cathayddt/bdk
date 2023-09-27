export enum WalletType {
  ETHEREUM = 'ethereum'
}
/**
 * @requires ethereum - [string] ethereum
*/
export interface WalletCreateType {
  type: WalletType
}
