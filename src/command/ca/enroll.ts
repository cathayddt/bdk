import { Argv } from 'yargs'
import prompts from 'prompts'
import { onCancel, ParamsError } from '../../util'
import Ca from '../../service/caService'
import { CaEnrollType } from '../../model/type/caService.type'
import config from '../../config'

export const command = 'enroll'

export const desc = 'Enroll certifications.'
interface CaEnrollParams extends CaEnrollType {
  interactive: boolean
}

export const builder = (yargs: Argv) => {
  return yargs
    .example('bdk ca enroll --interactive', 'Cathay BDK 互動式問答')
    .example('bdk ca enroll -t client -u rca -p 7054 --client-id admin --client-secret adminpw --role rca --org-hostname rca', '登入名稱為 rca 的 CA 機器')
    .option('interactive', { alias: 'i', describe: '是否使用 Cathay BDK 互動式問答', type: 'boolean' })
    .option('type', { alias: 't', describe: 'enrollment type - required', type: 'string', default: 'client' })
    .option('upstream', { alias: 'u', describe: 'enrollment upstream host - required', type: 'string' })
    .option('upstream-port', { alias: 'p', describe: 'enrollment upstream port - required', type: 'number', default: 7054 })
    .option('client-id', { describe: 'client id to enroll with - required', type: 'string' })
    .option('client-secret', { describe: 'secret corresponding to client id specified - required', type: 'string' })
    .option('role', { alias: 'r', describe: 'ca type rca, peer org or orderer org - required', type: 'string', default: 'rca' })
    .option('org-hostname', { alias: 'h', describe: 'enroll org hostname - required', type: 'string' })
    // .option('tls-certfile', { describe: 'tls certfile of upstream - required', type: 'string' })
}

const checkRequired = (argv: CaEnrollParams) => {
  if (
    !(
      !!argv.type &&
      !!argv.upstream &&
      !!argv.upstreamPort &&
      !!argv.clientId &&
      !!argv.clientSecret &&
      !!argv.role &&
      !!argv.orgHostname
    )
  ) {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}

export const handler = async (argv: CaEnrollParams) => {
  const ca = new Ca(config)

  if (argv.interactive) {
    const args = await prompts(
      [
        {
          type: 'select',
          name: 'type',
          message: 'Please specify enrollment type',
          choices: [
            {
              title: 'enroll ca client and org credentials',
              value: 'client',
            },
            {
              title: 'enroll orderer credentials',
              value: 'orderer',
            },
            {
              title: 'enroll peer certificates',
              value: 'peer',
            },
            {
              title: 'enroll org admin/user credentials',
              value: 'user',
            },
          ],
          initial: 0,
        },
        {
          type: 'text',
          name: 'upstream',
          message: 'Please specify upstream server hostname',
        },
        {
          type: 'number',
          name: 'upstreamPort',
          message: 'Please specify upstream server port',
          initial: 7054,
        },
        {
          type: 'text',
          name: 'clientId',
          message: 'Please specify client id to enroll',
        },
        {
          type: 'text',
          name: 'clientSecret',
          message:
            'Please specify the secret corresponding to the client id specified',
        },
        {
          type: 'select',
          name: 'role',
          message: 'Please specify org type',
          choices: [
            {
              title: 'this is a rca',
              value: 'rca',
            },
            {
              title: 'this is an orderer org',
              value: 'orderer',
            },
            {
              title: 'this is peer org',
              value: 'peer',
            },
          ],
          initial: 0,
        },
        {
          type: 'text',
          name: 'orgHostname',
          message:
            'Please specify the enroll org hostname',
        },
        // {
        //   type: 'text',
        //   name: 'tlsCertfile',
        //   message:
        //     'Please specify the path to the tls certfile of the upstream server',
        // },
      ],
      { onCancel },
    )

    await ca.enroll(args)
  } else {
    checkRequired(argv)
    await ca.enroll(argv)
  }
}
