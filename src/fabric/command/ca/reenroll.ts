import { Argv } from 'yargs'
import prompts from 'prompts'
import { onCancel, ParamsError } from '../../../util'
import Ca from '../../service/caService'
import { CaReenrollType } from '../../model/type/caService.type'
import config from '../../config'
import ora from 'ora'

interface CaReenrollParams extends CaReenrollType {
  interactive: boolean
}

export const command = 'reenroll'

export const desc = 'Reenroll certifications.'

export const builder = (yargs: Argv) => {
  return yargs
    .option('interactive', { alias: 'i', describe: '是否使用 Cathay BDK 互動式問答', type: 'boolean' })
    .option('upstream', { alias: 'u', describe: 'enrollment upstream host - required', type: 'string' })
    .option('upstream-port', { alias: 'p', describe: 'enrollment upstream port - required', type: 'number', default: 7054 })
    .option('client-id', { describe: 'client id to enroll with - required', type: 'string' })
    .option('client-secret', { describe: 'secret corresponding to client id specified - required', type: 'string' })
    .option('org-hostname', { alias: 'h', describe: 'enroll org hostname - required', type: 'string' })
}

export const handler = async (argv: CaReenrollParams) => {
  const ca = new Ca(config)
  if (argv.interactive) {
    const tools = await prompts([
      {
        type: 'select',
        name: 'tool',
        message: 'Please specify the building type of blockchain',
        choices: [
          {
            title: 'bdk (Not support now)',
            value: 'bdk',
          },
          {
            title: 'others',
            value: 'others',
          },
        ],
      },
    ], { onCancel })
    if (tools.tool === 'bdk') {
      ora('Not support bdk reenroll now').fail()
    } else {
      const args = await prompts(
        [
          {
            type: 'text',
            name: 'caPath',
            message: 'Please specify ca path that you want to reenroll',
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
        ],
        { onCancel },
      )

      const spinner = ora('Fabric Ca Reenroll ...').start()
      await ca.reenroll(args)
      spinner.succeed('Fabric Ca Reenroll Successfully!')
    }
  } else {
    throw new ParamsError('Invalid params: Required parameter missing')
  }
}
