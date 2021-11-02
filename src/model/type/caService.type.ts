/**
 * @requires caName - [string] CA 的名稱
 */
export interface CaDownType {
  caName: string
}

export interface CaBasicType {
  caName: string
  port: number
  adminUser: string
  adminPass: string
}

export interface CaCryptoType {
  tlsCertFile: string
  tlsKeyFile: string
  caCertFile: string
  caKeyFile: string
}
export interface CaSigningType {
  defaultExpiry: string
  profilesCaExpiry: string
  profilesTlsExpiry: string
}

export interface CaIntermediateType {
  parentserverUrl: string
  parentserverCn: string
  enrollmentHost: string
  // enrollmentProfile: string
}

/**
 * @requires cn - [string] CA 機器的通用名稱
 * @requires hosts - [string] host 的名稱
 * @requires expiry - [string] 憑證有效時間
 * @requires pathlength - [number] 底下 CA 的個數
 */
export interface CaCsrType {
  cn: string
  hosts: string
  expiry: string
  pathlength: number
}

/**
 * @requires basic - [object] CA 機器的基本資訊
 * @requires crypto - [object] CA 所需的憑證和私鑰的路徑位置
 * @requires csr - [{@link CaCsrType}]
 * @requires intermediate - [{@link CaIntermediateType}]
 * @requires upstreamEnabled - [boolean] 是否有父 CA
 */
export interface CaUpType {
  basic: CaBasicType
  crypto: CaCryptoType
  signing: CaSigningType
  csr: CaCsrType
  intermediate: CaIntermediateType
  upstreamEnabled: boolean
}

/**
 * @requires client - 身份為 client
 * @requires orderer - 身份為 orderer
 * @requires peer - 身份為 peer
 * @requires user - 身份為 user
 */
export enum CaEnrollCommandTypeEnum {
  client = 'client',
  orderer = 'orderer',
  peer = 'peer',
  user = 'user',
}

export enum CaEnrollTypeEnum {
  client = 'client',
  msp = 'msp',
  tls = 'tls',
  user = 'user',
}

export enum CaRegisterTypeEnum {
  ica = 'ica',
  orderer = 'orderer',
  peer = 'peer',
  admin = 'admin',
  user = 'user',
}

interface CaServiceType {
  upstream: string
  upstreamPort: number
  clientId: string
  clientSecret: string
}

/**
 * @requires upstream - [string] enrollment upstream host
 * @requires upstreamPort - [number] enrollment upstream port
 * @requires clientId - [string] client id to enroll with
 * @requires clientSecret - [string] secret corresponding to client id specified
 * @requires type - [{@link CaEnrollCommandTypeEnum}] enrollment type
 * @requires role - [string] ca type rca, peer org or orderer org
 * @requires orgHostname - [string] enroll org hostname
 */
export interface CaEnrollType extends CaServiceType {
  type: CaEnrollCommandTypeEnum
  role: string
  orgHostname: string
  // tlsCertfile: string
}

/**
 * @requires upstream - [string] registration upstream host
 * @requires upstreamPort - [number] registration upstream port
 * @requires clientId - [string] client id to register
 * @requires clientSecret - [string] secret for client id registered
 * @requires type - [{@link CaEnrollCommandTypeEnum}] registration type
 * @requires admin - [string] your identity (ica/rca admin name)
 */
export interface CaRegisterType extends CaServiceType {
  type: CaRegisterTypeEnum
  admin: string
  // tlsCertfile: string
}
