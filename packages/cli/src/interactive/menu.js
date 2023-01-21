const path = require('path')
const { Select, MultiSelect } = require('enquirer');
const YAML = require('yaml')

const { importSources, extract, buildDatabase, startServer } = require('../tasks')

const menu = {
  main: {
    prompt: () => new Select({
      message: 'Gallery main menu',
      choices: [
        {name: 'server', message: 'Start server'},
        {name: 'update', message: 'Update and process source files'},
        {name: 'system', message: 'System'},
        {name: 'exit', message: 'Exit'}
      ]
    }).run(),
    action: async (command, options) => {
      if (command === 'server') {
        return startServer(options);
      }
      return command;
    }
  },
  update: {
    prompt: () => new Select({
      message: 'Update files',
      choices: [
        {name: 'increment', message: 'Update and process only new files'},
        {name: 'initialSmall', message: 'Initial import with small files only (incremental processing)'},
        {name: 'initial', message: 'Initial import (incremental processing)'},
        {name: 'full', message: 'Process all files (one run)'},
        {name: 'main', message: 'Back'}
      ]
    }).run(),
    action: async (command, options) => {
      if (command == 'main') {
        return command
      }
      const { config } = options
      let sources = config.sources.filter(source => !source.offline)
      if (sources.length > 1) {
        const indices = await runner('selectSources', config)
        sources = sources.filter(source => indices.indexOf(source.index) >= 0)
      }

      const importOptions = {
        initialImport: command == 'initial' || command == 'initialSmall',
        incrementalUpdate: command == 'increment',
        smallFiles: command == 'initialSmall'
      }
      await importSources(config, sources, importOptions)
      return 'main'
    }
  },
  selectSources: {
    prompt: config => new MultiSelect({
      message: 'Select source directories to update',
      footer: '(use space to select, enter to confirm)',
      initial: config.sources.filter(source => !source.offline).map(source => source.index),
      choices: config.sources.map((source, i) => {
        return { value: source.index, message: `${i + 1}. Source dir: ${source.dir} (${path.basename(source.index)})`, disabled: source.offline, hint: `${source.offline ? '(offline)' : ''}`}
      })
    }).run(),
    action: async (indices, options) => {
      const { config } = options
      if (!indices.length) {
        console.log(`No source directories selected. Continue with all ${config.sources.length} sources`);
        return config.sources.filter(source => !source.offline).map(source => source.index)
      }
      return indices;
    }
  },
  system: {
    prompt: () => new Select({
      message: 'System options',
      choices: [
        {name: 'showConfig', message: 'Show expanded configuration'},
        {name: 'debugExtractor', message: 'Debug extractor'},
        {name: 'buildDatabase', message: 'Rebuild database'},
        {name: 'main', message: 'Back'}
      ]
    }).run(),
    action: async (command, options) => {
      const { config } = options
      if (command === 'showConfig') {
        console.log('gallery.config.yml:')
        console.log(YAML.stringify(config, null, 2))
        return 'system'
      } else if (command === 'debugExtractor') {
        let sources = config.sources.filter(source => !source.offline)
        if (sources.length > 1) {
          const indices = await runner('selectSources', config)
          sources = sources.filter(source => indices.indexOf(source.index) >= 0)
        }
        console.log('Debugging extractor: Adjust concurrent, skip and limit parameter to your need. Add --print-entry parameter to fine tune')
        await extract(config, sources, {
          concurrent: 1,
          skip: 0,
          limit: 0
        });
      } else if (command === 'buildDatabase') {
        console.log('Rebuild database')
        await buildDatabase(config, config.sources, {});
      } else {
        return 'main'
      }
    }
  }
}

const runner = (name, config, ...args) => {
  const item = menu[name]
  return item.prompt(config)
    .then(result => item.action ? item.action(result, config, ...args) : result)
    .then(result => {
      if (menu[result]) {
        return runner(result, config, ...args);
      } else {
        return result;
      }
    })
}

module.exports = { menu, runner }
