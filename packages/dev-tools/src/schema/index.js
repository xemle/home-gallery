import { schemaMerge } from './schema-merge.js'
import { schemaToType } from './schema-to-type.js'
import { schemaToYaml } from './schema-to-yaml.js'

/**
 * @param {string[]} args
 */
export async function schema(args) {
  const command = args.shift()
  switch (command) {
    case 'merge': {
      return schemaMerge()
    }
    case 'to-type': {
      return schemaToType()
    }
    case 'to-yaml': {
      return schemaToYaml()
    }
    default:
      throw new Error(`Unknown schema command: ${command}`)
    }

}