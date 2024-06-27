import { spawn } from 'child_process'

import { logger } from './log.js'

const log = logger('run')

class CmdError extends Error {
    code: number
    stdout: string
    stderr: string

    constructor(message: string, code: number, stdout: string, stderr: string) {
        super(message)
        this.code = code || 254
        this.stdout = stdout || ''
        this.stderr = stderr || ''
    }

    toString() {
        return `${this.message}`
    }
}

export const run = async (command: string, args: string[], options: any) => {
  const defaults = { shell: true }
  const optionsEnv = (options || {}).env || {}
  const env = { ...process.env, ...optionsEnv };
  const swanOptions = { ...defaults, ...options, env }

  return new Promise((resolve, reject) => {
      log.debug(`Run ${command} ${args.join(' ')}`)
      const cmd = spawn(command, args, swanOptions);

      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      if (cmd.stdout && cmd.stderr) {
          cmd.stdout.on('data', data => stdout.push(data))
          cmd.stderr.on('data', data => stderr.push(data))
      }

      const createError = (code: number = 254) => new CmdError(`Could not run ${command} ${args.join(' ')}. Exit code is ${code}`, code, Buffer.concat(stdout).toString(), Buffer.concat(stderr).toString())

      cmd.on('exit', (code: number, signal) => {
          const result = { code, signal, stdout: Buffer.concat(stdout).toString(), stderr: Buffer.concat(stderr).toString() }
          return code == 0 ? resolve(result) : reject(createError(code))
      });
      cmd.on('err', err => reject(createError(err.code)))
  })
}

export const runSimple = async (command: string[]) => run(command[0], command.slice(1), { stdio: 'inherit' })
