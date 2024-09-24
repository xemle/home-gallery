import t from 'tap'

import { promisify, SemVer } from '@home-gallery/common'

import { migrate, getMigrationsFor, getMigrationMapper, getDatabaseFileType } from './migrate.js'

t.only('getDatabaseFileType', async t => {
  t.test('basic', async t => {
    t.same(getDatabaseFileType().toString(), 'home-gallery/database@1.3.0')
  })
})

t.only('migrate', async t => {
  t.test('migrate from 1.0', async t => {
    const database = {
      type: 'home-gallery/database@1.0',
      created: '2024-07-23T20:47:22.021Z',
      data: [{
        id: '1171fab2c1474b0dfdcf2001dd6fb06be51463ae'
      }]
    }


    await migrate(database)


    t.same(database.type, 'home-gallery/database@1.3.0')
    t.same(database.data[0].hash, '445ac1dfa2e3cba3e273af6a8a7e6cfbee358882')
  })

})

t.only('getMigrationsFor', async t => {
  /** @type {import('./migrate.js').Migration} */
  const migrations = [
    {
      version: '1.1.0',
      description: 'Add foo',
      migrate: (entry) => entry.foo = false
    },
    {
      version: '1.2.0',
      description: 'Add bar',
      migrate: (entry) => entry.bar = true
    },
    {
      version: '1.1.1',
      description: 'Fix foo',
      migrate: (entry) => entry.foo = true
    },
    {
      version: '1.0.1',
      description: 'Fix type',
      migrate: (entry) => entry.type = 'test'
    }
  ]

  t.test('migrations are ordered by SemVer', async t => {
    const requiredMigrations = getMigrationsFor(new SemVer('1.0.0'), migrations)


    t.same(requiredMigrations.length, 4)
    t.same(requiredMigrations.map(m => m.version), ['1.0.1', '1.1.0', '1.1.1', '1.2.0'])
  })

  t.test('migrations are filtered', async t => {
    const requiredMigrations = getMigrationsFor(new SemVer('1.1.0'), migrations)


    t.same(requiredMigrations.length, 2)
    t.same(requiredMigrations.map(m => m.version), ['1.1.1', '1.2.0'])
  })
})

t.only('getMigrationMapper', async t => {
  /** @type {import('./migrate.js').Migration} */
  const migrations = [
    {
      version: '1.1',
      description: 'Add counter',
      migrate: entry => {
        entry.counter = entry.id
        return 42
      }
    },
    {
      version: '1.2',
      description: 'Increase counter',
      migrate: entry => entry.counter += 1
    },
    {
      version: '1.3',
      description: 'Multiply counter',
      migrate: entry => entry.counter *= 2
    },
  ]

  t.test('basic', async t => {
    const mapper = getMigrationMapper(migrations)


    const migratedEntry = mapper({id: 1})


    t.same(migratedEntry.counter, 4)
  })
})

