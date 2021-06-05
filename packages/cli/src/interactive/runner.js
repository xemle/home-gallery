const { menu } = require('./menu')

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

module.exports = { runner }
