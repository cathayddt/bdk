import prompts from 'prompts'
import config from '../config'
import { logger } from './logger'

class BdkError extends Error {}

export class ProcessError extends BdkError {}
export class ParamsError extends BdkError {}
export class DockerError extends BdkError {}
export class FabricContainerError extends BdkError {
  public stdout: string
  constructor (message: string, stdout: string) {
    super(message)
    this.stdout = stdout
  }
}

export const onCancel = (prompt: prompts.PromptObject<string>, answers: any) => {
  config.isDevMode && console.log(prompt)
  config.isDevMode && console.log(answers)
  logger.warn('prompts cancel: Are you send [SIGINT]?')
  process.exit(130)
}

export const errorHandler = (err: Error) => {
  if (err instanceof FabricContainerError) {
    logger.error(err.message)
  } else if (err instanceof BdkError) {
    logger.error(err.message)
  } else {
    logger.error('Unexpected error.\n')
    logger.error(err.message)
  }

  config.isDevMode && logger.error(err.stack)
}
