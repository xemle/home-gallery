import fs from 'fs/promises'

export class TemplateConfig {
  data: any

  async load(file: string) {
    const json = await fs.readFile(file, 'utf8')
    this.data = JSON.parse(json)
  }

}