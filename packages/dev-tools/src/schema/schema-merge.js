import { access, readFile, writeFile} from 'fs/promises'
import { compile } from 'json-schema-to-typescript'
import { glob } from 'glob'

/** @typedef {{type: string, properties?: Record<string, JsonSchemaNode>}} JsonSchemaNode */
/** @typedef {{'$id': string, title: string} & JsonSchemaNode} JsonSchema */

export async function schemaMerge() {
  const pkg = JSON.parse(await readFile('./package.json', 'utf-8'))
  const config = pkg?.gallery?.config
  if (!config) {
    return
  }

  const schemaFile = config.schema
  if (!schemaFile) {
    return
  }


  const schema = await access(schemaFile)
    .then(async () => JSON.parse(await readFile(schemaFile, 'utf-8')), () => ({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://schema.home-gallery.org/',
      title: schemaFile.replace(/\.schema\.json$/, ''),
      type: 'object',
      properties: {}
    }))

  /** @type {string[]} */
  const includes = config.includes || ['./src/**/*.schema.json']
  if (!includes.length) {
    return
  }

  const files = await glob(includes, {
    ignore: {
      ignored: p => !!p.name.match(/test/)
    }
  })

  let count = 0
  for (const file of files) {
    /** @type {JsonSchema} */
    const subSchema = JSON.parse(await readFile(file, 'utf-8'))
    /* @type {string[]} */
    const path = getSchemaPath(subSchema)
    insertSchema(schema, subSchema, path)
    count++
  }

  await writeFile(schemaFile, JSON.stringify(schema, null, 2), 'utf-8')
  console.log(`Merged ${count} schemas into ${schemaFile}`)

  const typeFile = pkg?.gallery?.config?.type
  if (!typeFile) {
    return
  }
  await compile(schema, schema.title)
    .then(ts => writeFile(typeFile, ts, 'utf-8'))
  console.log(`Created types in ${typeFile}`)
}

function getSchemaPath(/** @type {JsonSchema} */ schema) {
  try {
    const url = new URL(schema.$id)
    if (url.hash.length < 2) {
      return []
    }

    return url.hash.slice(1).split('.')
  } catch (e) {
    return []
  }
}

/**
 * @param {JsonSchemaNode} node
 * @param {JsonSchemaNode | JsonSchema} subSchema
 * @param {string[]} path
 * @returns
 */
export function insertSchema(node, subSchema, path) {
  if (node.type != 'object' || !node.properties) {
    return
  }

  if (path.length) {
    const name = path.shift() || ''
    if (!path.length) {
      node.properties[name] = subSchema
      return
    }

    if (!node.properties[name]) {
      node.properties[name] = {
        type: 'object',
        properties: {}
      }
    }
    const child = node.properties[name]
    insertSchema(child, subSchema, path)
    return
  }

  if (subSchema.type == 'object' && subSchema.properties) {
    Object.entries(subSchema.properties).forEach(([key, value]) => {
      if (node.properties) {
        node.properties[key] = value
      }
    })

    return
  }

}
