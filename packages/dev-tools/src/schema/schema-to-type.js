import { readFile, writeFile} from 'fs/promises'
import { basename } from 'path'
import { compile } from 'json-schema-to-typescript'
import { glob } from 'glob'

export async function schemaToType() {
  const pkg = JSON.parse(await readFile('./package.json', 'utf-8').catch(() => '{}'))
  const includes = pkg?.gallery?.config?.includes || ['./src/**/*.schema.json']

  const files = await glob(includes, {
    ignore: {
      ignored: p => !!p.name.match(/test/)
    }
  })

  let count = 0
  for (const file of files) {
    const schema = JSON.parse(await readFile(file, 'utf-8'))
    const tsFile = file.replace(/\.schema\.json$/, '.ts')

    const overwriteForTypeName = basename(tsFile).replace(/\.ts$/, '')
    schema.title = overwriteForTypeName

    await compile(schema, overwriteForTypeName)
      .then(ts => writeFile(tsFile, ts, 'utf-8'))
    count++
  }
  console.log(`Updated ${count} types`)
}

