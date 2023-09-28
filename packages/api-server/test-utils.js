const { spawn } = require('child_process')
const fetch = require('node-fetch')

const runCli = (command, args = [], options = {}, onExit = () => true) => {
  const env = {
    ...process.env,
    ...options.env
  }
  const child = spawn(command, args, { shell: false, stdio: 'pipe', ...options, env })
  const stdout = []
  const stderr = []

  child.stdout.on('data', data => {
    console.log(data.toString('utf8'))
    stdout.push(data)
  })
  child.stderr.on('data', data => stderr.push(data))

  child.on('close', (code, signal) => {
    onExit({
      code,
      signal,
      stdout: Buffer.concat(stdout).toString('utf8'),
      stderr: Buffer.concat(stdout).toString('utf8')
    })
  })

  return child
}

const delayAsync = async (delay = 0) => new Promise(resolve => setTimeout(resolve, delay))

const waitFor = async (fn, retryDelay = 0) => {
  return fn().catch(() => delayAsync(retryDelay).then(() => waitFor(fn, retryDelay)))
}

const waitForUrl = (url, retryDelay = 125) => {
  return waitFor(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
    }, 1000)
    return fetch(url, {
      signal: controller.signal
    }).then(res => {
      clearTimeout(timer)
      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`)
      }
      return res
    })
    .catch(e => {
      clearTimeout(timer)
      throw e
    })
  }, retryDelay)
}

module.exports = {
  runCli,
  waitFor,
  waitForUrl
}