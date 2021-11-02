#!/usr/bin/env node

import yargs from 'yargs'
import config from './config'
import { errorHandler } from './util'

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
  .commandDir('command')
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
