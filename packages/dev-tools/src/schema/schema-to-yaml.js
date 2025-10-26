import { readFile, writeFile } from 'fs/promises'
import { YamlNode } from './YamlNode.js'

export async function schemaToYaml() {
  const pkg = JSON.parse(await readFile('./package.json', 'utf-8').catch(cause => Promise.reject(new Error('Failed to read package.json in current directory', {cause}))))
  const schemaFile = pkg.gallery?.config?.schema
  if (!schemaFile) {
    throw new Error('No schema file configured in package.json#gallery.config.schema')
  }

  /* @type {import('json-schema-to-typescript').JSONSchema} */
  const schema = JSON.parse(await readFile(schemaFile, 'utf-8').catch(cause => Promise.reject(new Error(`Failed to read schema file: ${schemaFile}`, {cause}))))

  const output = []
  renderYaml(schema, output)

  const yamlFile = pkg.gallery?.config?.yaml || schemaFile.replace('.schema.json', '.yaml')
  await writeFile(yamlFile, output.join('\n')).catch(cause => Promise.reject(new Error(`Failed to write yaml file: ${yamlFile}`, {cause})))
  console.log(`Wrote config yaml to ${yamlFile}`)
}

/**
 * @param {import('json-schema-to-typescript').JSONSchema} schema
 * @param {string[]} output
 */
export function renderYaml(schema, output) {
  if (schema.type != 'object' || !schema.properties) {
    return output
  }

  if (schema.$id) {
    output.push(`# yaml-language-server: $schema=${schema.$id}`)
  }

  const root = new YamlNode(null, schema, '', 0)
  for (const [key, value] of Object.entries(schema.properties)) {
    expandNode(root, value, key, 0, false, true)
  }

  /* @type {string[]} */
  const head = []
  root.renderComment(head)
  if (head.length > 0) {
    output.push(...head, '', '')
  }

  let isPrevObjectArray = false
  root.children.forEach((child, i) => {
    // surround empty lines of top-level objects/arrays for better readability
    const isObjectArray = child.schema.type == 'object' || child.schema.type == 'array'
    if (i > 0 && (isObjectArray || isPrevObjectArray)) {
      output.push('')
    }
    isPrevObjectArray = isObjectArray

    child.render(output, false, true)
  })
}

/**
 * @param {YamlNode} parent
 * @param {import('json-schema').JSONSchema4} schema
 * @param {string} name
 * @param {number} depth
 * @param {boolean} isArrayItem
 */
function expandNode(parent, schema, name = '', depth = 0, isArrayItem = false, isObjectProperty = false) {
  if (schema.type == 'object' && typeof schema.properties == 'object') {
    const object = new YamlNode(parent, schema, name, depth)
    for (const [key, value] of Object.entries(schema.properties)) {
      expandNode(object, value, key, depth + (isArrayItem ? 0 : 1), false, true)
    }
    return
  }

  if (schema.type == 'array' && typeof schema.items == 'object') {
    const array = new YamlNode(parent, schema, name, depth)
    expandNode(array, schema.items, '', depth + 2, true) // doubled depth for array items for '- ' prefix
    return
  }

  if (isScalarType(schema) || Array.isArray(schema.enum) || schema.const) {
    new YamlNode(parent, schema, name, depth)
    return
  }

  const ofList = schema.oneOf || schema.anyOf || schema.allOf
  if (Array.isArray(ofList)) {
    const of = new YamlNode(parent, schema, name, depth)
    ofList.forEach(value => {
      expandNode(of, value, isObjectProperty ? name : '', depth, isArrayItem, isObjectProperty)
    })
    return
  }
}

function isScalarType(schema) {
  return schema.type == 'boolean' || schema.type == 'number' || schema.type == 'integer' || schema.type == 'string'
}
