const path = require('path');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');

const { loggerMiddleware } = require('./logger-middleware')
const { EventBus } = require('./eventbus');
const databaseApi = require('./api/database');
const treeApi = require('./api/database/tree');
const eventsApi = require('./api/events');
const webapp = require('./webapp');
const { augmentReqByUserMiddleware, createBasicAuthMiddleware, defaultIpWhitelistRules } = require('./auth')
const { isIndex, skipIf } = require('./utils')

const eventbus = new EventBus()

const webappDir = path.join(__dirname, 'public')

function shouldCompress (req, res) {
  if (req.headers['x-no-compression']) {
    return false
  }

  return compression.filter(req, res)
}

const getAuthMiddleware = config => {
  const users = config.server?.auth?.users || []
  const rules = config.server?.auth?.rules || defaultIpWhitelistRules
  if (users.length) {
    return createBasicAuthMiddleware(users, rules)
  }
  return (req, _, next) => next()
}

function createApp(config) {

  const app = express();
  app.disable('x-powered-by')
  app.enable('trust proxy')

  app.use(augmentReqByUserMiddleware())
  app.use(loggerMiddleware())
  app.use(cors());
  app.use(compression({ filter: shouldCompress }))

  app.use(skipIf(express.static(webappDir), isIndex))

  app.use(getAuthMiddleware(config))

  app.use('/files', express.static(config.storage.dir, {index: false, maxAge: '2d', immutable: true}));
  app.use(bodyParser.json({limit: '1mb'}))

  const { read: readEvents, push: pushEvent, stream, getEvents } = eventsApi(eventbus, config.events.file);
  const { read: readDatabase, init: initDatabase, getFirstEntries, getDatabase } = databaseApi(eventbus, config.database.file, getEvents);
  const { read: readTree } = treeApi(eventbus, getDatabase);

  app.get('/api/events.json', readEvents);
  app.get('/api/events/stream', stream);
  app.post('/api/events', pushEvent);
  app.get('/api/database.json', readDatabase);
  app.get('/api/database/tree/:hash', readTree);

  if (config.server.remoteConsoleToken) {
    const debugApi = require('./api/debug')({remoteConsoleToken: config.server?.remoteConsoleToken})
    app.post('/api/debug/console', debugApi.console);
  }

  // deprecated
  app.get('/api/database', readDatabase);
  app.get('/api/events', readEvents);

  const disabled = config?.webapp?.disabled || []
  app.use(webapp(webappDir, req => ({
    disabled: !!req.user ? [...disabled, 'pwa'] : disabled,
    entries: getFirstEntries(50)
  }), {
    basePath: config.server.basePath || '/',
    injectRemoteConsole: !!config.server.remoteConsoleToken
  }));

  return {
    app,
    initDatabase
  }
}

module.exports = {
  createApp
}
