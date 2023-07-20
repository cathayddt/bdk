import React from 'react'
import { Argv } from 'yargs'
import { render } from 'ink'
import App from './views/app.js'

export const command = 'ui'

export const desc = '使用 ui 模式'
export const builder = (yargs: Argv<any>) => {
  return yargs
}

export const handler = () => {
  render(<App />)
}
