#!/usr/bin/env node

import yargs from 'yargs'
import config from './fabric/config'
import { errorHandler, ProcessError } from './util'

(config.isDevMode || config.isTestMode) && require('source-map-support/register')

const usageText = `
Blockchain Deploy Kit

      ::::::::    :::::::     :::    :::
     :+:   :+:   :+:   :+:   :+:   :+:
    +:+    +:+  +:+    +:+  +:+  +:+
   +#++:++#+   +#+    +:+  +#++:++
  +#+    +#+  +#+    +#+  +#+  +#+
 #+#   #+#   #+#   #+#   #+#   #+#
########    ########    ###    ###
`

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const argv = yargs
  .check(() => {
    if (process.getuid() === 0) throw new ProcessError('⚠️  DO NOT RUN AS ROOT ⚠️ ')
    return true
  })
  .commandDir('fabric')
  .commandDir('quorum')
  .commandDir('wallet')
  .commandDir('hello')
  .commandDir('dashboard')
  .strict()
  .demandCommand()
  .completion()
  .usage(usageText)
  // .recommendCommands()
  // .showHelpOnFail(true, 'Specify --help for available options')
  .fail((msg, err, _yargs) => {
    if (err) errorHandler(err) // preserve stack
    else console.error(_yargs.help(), '\n\n', msg)
    process.exit(1)
  })
  // .epilog('dddd')
  // .onFinishCommand((resultValue) => {
  //   console.log('onFinishCommand')
  // })
  .argv
