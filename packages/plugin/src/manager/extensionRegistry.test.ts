import t from 'tap'

import { ExtensionRegistry } from './extensionRegistry.js'
import { QuerySchema } from './pluginSchemas.js'

t.only('ExtensionRegistry', async t => {
  t.test('success', async t => {
    const registry = new ExtensionRegistry({
      'query': QuerySchema
    })

    const plugin = {
      name: 'Acme',
      version: '1.0',
      async initialize() {
        return {}
      }
    }

    t.resolves(registry.register(plugin, 'query', {
      name: 'acme',
      textFn: () => ''
    }))
  })

  t.test('reject on invalid extension', async t => {
    const registry = new ExtensionRegistry({
      'query': QuerySchema
    })

    const plugin = {
      name: 'Acme',
      version: '1.0',
      async initialize() {
        return {}
      }
    }

    t.rejects(registry.register(plugin, 'query', {
      name: 'acme'
    }))
  })

  t.test('reject on unknown extension type', async t => {
    const registry = new ExtensionRegistry({
      'query': QuerySchema
    })

    const plugin = {
      name: 'Acme',
      version: '1.0',
      async initialize() {
        return {}
      }
    }

    t.rejects(registry.register(plugin, 'extractor', {
      name: 'acme',
      async create() {
      }
    }))
  })
})