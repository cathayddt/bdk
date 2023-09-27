import { execSync } from 'child_process'
import { ItemProps } from '../models/type/ui.type'

export default class CommandContext {
  public getCommandContext (command: string): (string|undefined)[] {
    const text = execSync(`${command} --help`).toString()

    const regex = /(?::|：|คอมมาน)\n((?:\s+.*\n)+)/
    const match = regex.exec(text)

    const commandsRegex = this.makeRegex(command)
    if (match) {
      const commandsText = match[1]
      const commands = commandsText.match(commandsRegex)
        ?.map((match) => `${command} ${match.trim().split(/\s+/).pop()}`) ?? []
      return commands
    }
    return []
  }

  public getCommandHelp (command: string): string {
    const output = execSync(`${command} --help`).toString()
    return output
  }

  public executeCommand (command: string): string {
    // @TODO: support interactive mode
    // if (this.checkInteractive(command)) {
    //   output = execSync(`${command} --interactive`).toString()
    // }
    const output = execSync(command).toString()
    return output
  }

  public makeItem (command: string): ItemProps[] {
    const commands = this.getCommandContext(command)
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
