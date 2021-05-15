import { spawn } from 'child_process'

import { logger } from './log'

const log = logger.child({module: 'run'})

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

      cmd.on('exit', (code, signal) => {
          const result = { code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }
          return code == 0 ? resolve(result) : reject(result)
      });
      cmd.on('err', err => {
          err.code = err.code || 254;
          err.stdout = Buffer.concat(stdout);
          err.stderr = Buffer.concat(stderr);
          reject(err)
      })
  })
}

export const runSimple = async (command: string[]) => run(command[0], command.slice(1), { stdio: 'inherit' })
