const assert = require('assert');

step('Stderr is empty', async () => {
  const commandHistory = gauge.dataStore.scenarioStore.get('commandHistory') || []
  const stderrs = commandHistory.map(h => h.stderr).filter(out => out)
  assert(!stderrs.length, `Standard error output is not empty: ${stderrs.join('\n')}`)
})