import Logger from '@home-gallery/logger'

const log = Logger('database.migration')

import { GalleryFileType, SemVer, createHash, serialize } from '@home-gallery/common'

export const getDatabaseFileType = () => {
  const maxSemVer = databaseMigrations
    .map(m => new SemVer(m.version))
    .reduce((max, semVer) => semVer.gt(max) ? semVer : max)

  return new GalleryFileType(`home-gallery/database@${maxSemVer}`, '1.0.0')
}

export const migrate = async (database) => {
  const databaseFileType = getDatabaseFileType()
  if (!database?.type) {
    throw new Error(`Unknown data type. Missing type property`)
  } else if (!databaseFileType.isCompatibleType(database.type)) {
    throw new Error(`Incompatible data type: ${database.type}. Expected type is ${databaseFileType}`)
  }

  const type = new GalleryFileType(database.type)
  const requiredMigrations = getMigrationsFor(type.semVer)

  if (!requiredMigrations.length) {
    return database
  }

  log.debug(`Migrating database from ${type.semVer}`)
  requiredMigrations.forEach(migration => {
    log.debug(`Migrate to ${migration.version}: ${migration.description}`)
  })

  const t0 = Date.now()
  const migrationMapper = getMigrationMapper(requiredMigrations)
  database.data = database.data.map(migrationMapper)
  database.type = databaseFileType.toString()
  log.info(t0, `Database migrated`)

  return database
}

/**
 * @param {import('@home-gallery/common').SemVer} baseSemVer
 * @param {Migration[]} [migrations]
 * @returns {Migration}
 */
export const getMigrationsFor = (baseSemVer, migrations = databaseMigrations) => {
  const requiredMigrations = migrations
    .filter(migration => {
      const semVer = new SemVer(migration.version)
      return semVer.gt(baseSemVer)
    })
    .sort((a, b) => {
      const aSemVer = new SemVer(a.version)
      const bSemVer = new SemVer(b.version)
      return !aSemVer.ge(bSemVer) ? -1 : 1
    })

  return requiredMigrations
}

/**
 * @callback MigrationMapper
 * @param {object} entry
 * @returns {object}
 */
/**
 * @param {Migration[]} migrations
 * @returns {MigrationMapper}
 */
export const getMigrationMapper = migrations => {
  return entry => {
    for (let i = 0; i < migrations.length; i++) {
      migrations[i].migrate(entry)
    }
    return entry
  }
}

/**
 * Perform synchronized migration task on the entry
 *
 * @callback MigrationFunction
 * @param {object} entry
 */
/**
 * @typedef Migration
 * @prop {string} version
 * @prop {string} description
 * @prop {MigrationFunction} migrate
 */
/**
 * @type {Migration[]}
 */
const databaseMigrations = [
  {
    version: '1.3.0',
    description: 'Add hash property',
    migrate(entry) {
      entry.hash = createHash(serialize(entry, 'appliedEventIds'))
    }
  }
]
