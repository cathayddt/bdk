import { exec, execSync } from 'child_process'
import { ItemProps } from '../models/type/ui.type'

export default class CommandContext {
  public getCommandContext (command: string): Promise<(string | undefined)[]> {
    return new Promise((resolve, reject) => {
      exec(`${command} --help`, (error, stdout) => {
        if (error) {
          reject(error.message)
          return
        }

        const regex = /(?::|：|คอมมาน)\n((?:\s+.*\n)+)/
        const match = regex.exec(stdout.toString())

        const commandsRegex = this.makeRegex(command)
        if (match) {
          const commandsText = match[1]
          const commands = commandsText.match(commandsRegex)
            ?.map((match) => `${command} ${match.trim().split(/\s+/).pop()}`) ?? []
          resolve(commands)
        } else {
          resolve([])
        }
      })
    })
  }

  public getCommandHelp (command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(`${command} --help`, (error, stdout) => {
        if (error) {
          reject(error.message)
          return
        }
        resolve(stdout.toString())
      })
    })
  }

  public executeCommand (command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout) => {
        if (error) {
          reject(error.message)
          return
        }
        resolve(stdout.toString())
      })
    })
  }

  public async makeItem (command: string): Promise<ItemProps[]> {
    const commands = await this.getCommandContext(command)
    // map commands to key value pair and ignore undefined
    const items = commands.map((command) => {
      if (command) return { label: command, value: command }
    }) as ItemProps[]
    return items
  }

  private checkInteractive (command: string): boolean {
    const text = execSync(`${command} --help`).toString()
    const regex = /interactive/
    const match = regex.exec(text)
    if (match) return true
    return false
  }

  private makeRegex (command: string): RegExp {
    return new RegExp(`\\s+${command}\\s+([A-Za-z0-9]+)`, 'g')
  }
}
