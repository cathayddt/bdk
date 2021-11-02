import { Argv } from 'yargs'
import prompts from 'prompts'
import { onCancel, ParamsError } from '../../util'
import Ca from '../../service/caService'
import { CaRegisterType } from '../../model/type/caService.type'
import config from '../../config'

export const command = 'register'

export const desc = 'Register member.'

interface CaRegisterParams extends CaRegisterType {
  interactive: boolean
}

export const builder = (yargs: Argv) => {
  return yargs
    .example('bdk ca register --interactive', 'Cathay BDK 互動式問答')
    .example('bdk ca register -t ica -a admin -u rca -p 7054 --client-id ica.example.com --client-secret icapw', '註冊名稱為 ica 的 CA 機器')
    .option('interactive', { alias: 'i', describe: '是否使用 Cathay BDK 互動式問答', type: 'boolean' })
    .option('type', { alias: 't', describe: 'registration type - required', type: 'string', default: 'user' })
    .option('admin', { alias: 'a', describe: 'your identity (ica/rca admin name) - required', type: 'string', default: 'admin' })
    .option('upstream', { alias: 'u', describe: 'registration upstream host - required', type: 'string' })
    .option('upstream-port', { alias: 'p', describe: 'registration upstream port - required', type: 'number', default: 7054 })
    .option('client-id', { describe: 'client id to register - required', type: 'string' })
    .option('client-secret', { describe: 'secret for client id registered - required', type: 'string' })
    // .option('tls-certfile', { describe: 'tls certfile of upstream - required', type: 'string' })
}

const checkRequired = (argv: CaRegisterParams) => {
  if (
    !(
      !!argv.type &&
      !!argv.upstream &&
      !!argv.upstreamPort &&
      !!argv.clientId &&
      !!argv.clientSecret
    )
  ) {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}

export const handler = async (argv: CaRegisterParams) => {
  const ca = new Ca(config)

  if (argv.interactive) {
    const args = await prompts([
      {
        type: 'select',
        name: 'type',
        message: 'Please specify register type',
        choices: [
          {
            title: 'register ica',
            value: 'ica',
          },
          {
            title: 'register orderer',
            value: 'orderer',
          },
          {
            title: 'register peer',
            value: 'peer',
          },
          {
            title: 'register org admin',
            value: 'admin',
          },
          {
            title: 'register org user',
            value: 'user',
          },
        ],
        initial: 0,
      },
      {
        type: 'text',
        name: 'admin',
        message: 'Please specify your identity (ica/rca admin name)',
        initial: 'admin',
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
        message: 'Please specify client id to register',
      },
      {
        type: 'text',
        name: 'clientSecret',
        message: 'Please specify the secret for the client id registered',
      },
      // {
      //   type: 'text',
      //   name: 'tlsCertfile',
      //   message:
      //     'Please specify the path to the tls certfile of the upstream server',
      // },
    ], { onCancel })
    await ca.register(args)
  } else {
    checkRequired(argv)
    await ca.register(argv)
  }
}
