import { execSync } from 'child_process'

export default class commandContext {
  public getCommandContext (command: string): (string|undefined)[] {
    const text = execSync(`${command} --help`).toString()

    const regex = /(?::|：|คอมมาน)\n((?:\s+.*\n)+)/
    const match = regex.exec(text)

    const commandsRegex = this.makeRegex(command)
    if (match) {
      const commandsText = match[1]
      const commands = commandsText.match(commandsRegex)
        ?.map((match) => `${command} ${match.trim().split(/\s+/).pop()}`) ?? []
      console.log(commands)
      return commands
    }
    return []
  }

  public getCommandOutput (command: string): string {
    let output
    if (this.checkInteractive(command)) {
      output = execSync(`${command} --interactive`).toString()
    }
    output = execSync(command).toString()
    return output
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
