import { Argv } from 'yargs'
import prompts from 'prompts'
import { onCancel, ParamsError } from '../../util'
import Ca from '../../service/caService'
import { CaUpType } from '../../model/type/caService.type'
import config from '../../config'

export const command = 'up'

export const desc = 'Bring up CA.'

export interface CaServiceUpParams {
  interactive: boolean
  caName: string
  port: number
  adminUser: string
  adminPass: string
  caCertfile: string
  caKeyfile: string
  tlsCertfile: string
  tlsKeyfile: string
  signEnrollmentExpiry: string
  signCaExpiry: string
  signTlsExpiry: string
  csrCn: string | null
  csrHosts: string | null
  csrExpiry: string | null
  csrPathlength: number | null
  icaParentserverUrl: string | null
  icaParentserverCn: string | null
  icaEnrollmentHost: string | null
  // icaEnrollmentProfile: string | null
  // icaTlsCertfile: string | null
  role: string | null
}

export const builder = (yargs: Argv) => {
  return yargs.options({
    interactive: {
      alias: 'i',
      describe: 'call interactive wizard',
      type: 'boolean',
    },
    'ca-name': {
      alias: 'n',
      describe: '(CA) service name - required',
      type: 'string',
    },
    port: {
      alias: 'p',
      describe: '(CA) service port - required',
      type: 'number',
      default: 7054,
    },
    'admin-user': {
      describe: '(CA) admin user name',
      type: 'string',
      default: 'admin',
    },
    'admin-pass': {
      describe: '(CA) admin password',
      type: 'string',
      default: 'adminpw',
    },
    'ca-certfile': {
      describe: '(CA) service certfile',
      type: 'string',
    },
    'ca-keyfile': {
      describe: '(CA) service keyfile',
      type: 'string',
    },
    'tls-certfile': {
      describe: '(TLS) certfile for ca service',
      type: 'string',
    },
    'tls-keyfile': {
      describe: '(TLS) keyfile for ca service',
      type: 'string',
    },
    'sign-enrollment-expiry': {
      describe: '(Signing) Expiry for downstream entity enrollments - required',
      type: 'string',
      default: '8760h',
    },
    'sign-ca-expiry': {
      describe: '(Signing) Expiry for downstream CA enrollments - required',
      type: 'string',
      default: '43800h',
    },
    'sign-tls-expiry': {
      describe: '(Signing) Expiry for downstream TLS enrollments - required',
      type: 'string',
      default: '8760h',
    },
    'csr-cn': {
      describe: '(CSR) Common name for CSR if this is an CA',
      type: 'string',
    },
    'csr-hosts': {
      describe: '(CSR) Hosts for CSR if this is an CA',
      type: 'string',
    },
    'csr-expiry': {
      describe: '(CSR) Certificate expiry for CSR if this is an CA',
      type: 'string',
      default: '131400h',
    },
    'csr-pathlength': {
      describe: '(CSR) Pathlength for CSR if this is an CA',
      type: 'number',
      default: 0,
    },
    'ica-parentserver-url': {
      describe: '(ICA) Parentserver connection info for ICA if this is an ICA',
      type: 'string',
      default: 'https://<id>:<secret>@hostname',
    },
    'ica-parentserver-cn': {
      describe: '(ICA) Parentserver CA common name for ICA if this is an ICA',
      type: 'string',
    },
    'ica-enrollment-host': {
      describe: '(ICA) Host to enroll certificates for ICA if this is an ICA',
      type: 'string',
    },
    'ica-enrollment-profile': {
      describe:
        '(ICA) Profile to enroll certificates for ICA if this is an ICA',
      type: 'string',
      default: 'ca',
    },
    'ica-tls-certfile': {
      describe: '(ICA) TLS certfile for parent server if this is an ICA',
    },
    role: {
      describe: '(ICA) Org type orderer/peer for ICA if this is an ICA',
    },
  })
}

const checkRequired = (argv: CaServiceUpParams) => {
  if (
    !(
      !!argv.caName &&
      !!argv.port &&
      !!argv.adminUser &&
      !!argv.adminPass &&
      !!argv.signEnrollmentExpiry &&
      !!argv.signCaExpiry &&
      !!argv.signTlsExpiry
    )
  ) {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}

const checkCertKeyPairs = (argv: CaServiceUpParams) => {
  if (
    !!argv.caCertfile !== !!argv.caKeyfile ||
    !!argv.tlsCertfile !== !!argv.tlsKeyfile
  ) {
    throw new ParamsError('Invalid params: Missing element in cert-key pair')
  }
}

const checkCsr = (argv: CaServiceUpParams) => {
  let csrCheck: boolean
  if (
    !!argv.csrCn &&
    !!argv.csrHosts
    // !!argv.rcaExpiry &&
    // !!argv.rcaPathlength
  ) {
    csrCheck = true
  } else if (
    !argv.csrCn &&
    !argv.csrHosts
    // !argv.rcaExpiry &&
    // !argv.rcaPathlength
  ) {
    csrCheck = true
  } else {
    throw new ParamsError(
      'Invalid params: You can only either fill all CSR parameters or leave all parameters blank',
    )
  }
  return csrCheck
}

const checkIca = (argv: CaServiceUpParams) => {
  let icaCheck: boolean
  // TODO 檢查方式不對，如果參數有預設值，這邊還是會有值
  if (
    // !!argv.interParentserverUrl &&
    !!argv.icaParentserverCn &&
    !!argv.icaEnrollmentHost
    // !!argv.interEnrollmentProfile
  ) {
    icaCheck = true
  } else if (
    // !argv.interParentserverUrl &&
    !argv.icaParentserverCn &&
    !argv.icaEnrollmentHost
    // !argv.interEnrollmentProfile
  ) {
    icaCheck = false
  } else {
    throw new ParamsError(
      'Invalid params: You can only either fill all ICA parameters or leave all parameters blank',
    )
  }
  return icaCheck
}

const transformCaServiceUpObj = (arg: CaServiceUpParams) => {
  return {
    basic: {
      caName: arg.caName,
      port: arg.port,
      adminUser: arg.adminUser,
      adminPass: arg.adminPass,
    },
    crypto: {
      tlsCertFile: arg.tlsCertfile || '',
      tlsKeyFile: arg.tlsKeyfile || '',
      caCertFile: arg.caCertfile || '',
      caKeyFile: arg.caKeyfile || '',
    },
    signing: {
      defaultExpiry: arg.signEnrollmentExpiry,
      profilesCaExpiry: arg.signCaExpiry,
      profilesTlsExpiry: arg.signTlsExpiry,
    },
    csr: {
      cn: arg.csrCn,
      hosts: arg.csrHosts,
      expiry: arg.csrExpiry,
      pathlength: arg.csrPathlength,
    },
    intermediate: {
      parentserverUrl: arg.icaParentserverUrl || '',
      parentserverCn: arg.icaParentserverCn || '',
      enrollmentHost: arg.icaEnrollmentHost || '',
      // enrollmentProfile: arg.icaEnrollmentProfile || '',
    },
    upstreamEnabled: checkIca(arg),
  } as CaUpType
}

export const handler = async (argv: CaServiceUpParams) => {
  const ca = new Ca(config)

  if (argv.interactive) {
    const basic = await prompts(
      [
        {
          type: 'text',
          name: 'caName',
          message: 'What do you want to call this CA?',
        },
        {
          type: 'number',
          name: 'port',
          message: 'Which port would you like to open for this CA service?',
          initial: 7054,
        },
        {
          type: 'text',
          name: 'adminUser',
          message: 'Please set your admin user name',
          initial: 'admin',
        },
        {
          type: 'text',
          name: 'adminPass',
          message: 'Please set your admin password',
          initial: 'adminpw',
        },
      ],
      { onCancel },
    )
    const settings = await prompts(
      [
        {
          type: 'select',
          name: 'caType',
          message: 'Please select the type of this CA service',
          choices: [
            {
              title: 'Root Certificate Authority(RCA)',
              value: 'RCA',
            },
            {
              title: 'Intermediate Certificate Authority(ICA)',
              value: 'ICA',
            },
          ],
          initial: 0,
        },
        {
          type: 'select',
          name: 'customTlsCert',
          message: 'Do you want to use a pre-generated TLS cert-key pair?',
          choices: [
            {
              title: 'Yes, I will supply the file path for them',
              value: 'yes',
            },
            {
              title: 'No, please generate them for me',
              value: 'no',
            },
          ],
          initial: 1,
        },
        {
          type: (prev) => (prev === 'yes' ? 'text' : null),
          name: 'tlsCertfile',
          message: 'Please specify the path to your custom TLS certfile',
        },
        {
          type: (prev) => (prev === 'yes' ? 'text' : null),
          name: 'tlsKeyfile',
          message: 'Please specify the path to your custom TLS keyfile',
        },
        {
          type: 'select',
          name: 'customCaCert',
          message: 'Do you want to use a pre-generated CA cert-key pair?',
          choices: [
            {
              title: 'Yes, I will supply the file path for them',
              value: 'yes',
            },
            {
              title: 'No, please generate them for me',
              value: 'no',
            },
          ],
          initial: 1,
        },
        {
          type: (prev) => (prev === 'yes' ? 'text' : null),
          name: 'caCertfile',
          message: 'Please specify the path to your custom CA certfile',
        },
        {
          type: (prev) => (prev === 'yes' ? 'text' : null),
          name: 'caKeyfile',
          message: 'Please specify the path to your custom CA keyfile',
        },
      ],
      { onCancel },
    )

    let crypto
    if (!crypto) {
      crypto = {}
    }
    if (settings.customTlsCert) {
      crypto = Object.assign(crypto, {
        tlsCertFile: settings.tlsCertfile,
        tlsKeyFile: settings.tlsKeyfile,
      })
    } else {
      crypto = Object.assign(crypto, { tlsCertfile: '', tlsKeyFile: '' })
    }
    if (settings.customCaCert) {
      crypto = Object.assign(crypto, {
        caCertFile: settings.caCertfile,
        caKeyFile: settings.caKeyfile,
      })
    } else {
      crypto = Object.assign(crypto, { caCertfile: '', caKeyFile: '' })
    }

    const signing = await prompts(
      [
        {
          type: 'text',
          name: 'defaultExpiry',
          message: 'Please specify the expiry for downstream entity enrollments',
          initial: '8760h',
        },
        {
          type: 'text',
          name: 'profilesCaExpiry',
          message: 'Please specify the CSR expiry for downstream CA enrollments',
          initial: '43800h',
        },
        {
          type: 'text',
          name: 'profilesTlsExpiry',
          message: 'Please specify the CSR expiry for downstream TLS enrollments',
          initial: '8760h',
        },
      ],
      { onCancel },
    )

    let csr
    if (settings.caType === 'RCA') {
      csr = await prompts(
        [
          {
            type: 'text',
            name: 'cn',
            message: 'Please specify the CSR common name for this CA',
          },
          {
            type: 'text',
            name: 'hosts',
            message: 'Please specify the CSR host for this CA',
          },
          {
            type: 'text',
            name: 'expiry',
            message: 'Please specify the CSR expiry for this CA',
            initial: '131400h',
          },
          {
            type: 'number',
            name: 'pathlength',
            message:
              'Please specify the CSR pathlength for this CA (recommend to use 1 if you wish to establish ICAs )',
          },
        ],
        { onCancel },
      )
    } else if (settings.caType === 'ICA') {
      csr = await prompts(
        [
          {
            type: 'text',
            name: 'expiry',
            message: 'Please specify the CSR expiry for this CA',
            initial: '131400h',
          },
          {
            type: 'number',
            name: 'pathlength',
            message:
              'Please specify the CSR pathlength for this CA (recommend to use 1 if you wish to establish ICAs )',
          },
        ],
        { onCancel },
      )
    }

    let intermediate
    if (settings.caType === 'ICA') {
      intermediate = await prompts(
        [
          {
            type: 'text',
            name: 'parentserverCn',
            message: 'Please specify the common name of the parentserver',
          },
          {
            type: 'text',
            name: 'parentServerHost',
            message: 'Please specify the hostname of the parentserver',
          },
          {
            type: 'text',
            name: 'parentServerPort',
            message: 'Please specify the port of the parentserver',
            initial: '7054',
          },
          {
            type: 'text',
            name: 'enrollmentId',
            message:
              'Please specify enrollment id of this CA registered on the parentserver',
          },
          {
            type: 'text',
            name: 'enrollmentSecret',
            message:
              'Please provide the enrollment secret of this CA corresponding to the enrollment id registered on the parentserver',
          },
          {
            type: 'text',
            name: 'enrollmentHost',
            message:
              'Please specify the hostname to enroll client credentials from the parentserver with',
          },
        ],
        { onCancel },
      )

      intermediate = Object.assign(intermediate, {
        parentserverUrl: `https://${intermediate.enrollmentId}:${intermediate.enrollmentSecret}@${intermediate.parentServerHost}:${intermediate.parentServerPort}`,
        enrollmentProfile: 'ca',
      })
    } else {
      intermediate = {
        parentserverUrl: '',
        parentserverCn: '',
        enrollmentHost: '',
        // enrollmentProfile: '',
      }
    }
    await ca.up(
      {
        basic,
        crypto,
        csr,
        intermediate,
        signing,
        upstreamEnabled: settings.caType === 'ICA',
      } as CaUpType,
    )
  } else {
    checkRequired(argv)
    checkCertKeyPairs(argv)
    checkCsr(argv)
    await ca.up(transformCaServiceUpObj(argv))
  }
}
