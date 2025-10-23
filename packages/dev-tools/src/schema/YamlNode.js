export class YamlNode {
  static IDENT = '  '

  /* @type {string} */
  name
  /** @type import('json-schema').JSONSchema4 */
  schema
  /* @type {number} */
  depth = 0
  /* @type {YamlNode | null} */
  parent
  /* @type {YamlNode[]} */
  children = []
  /* @type {boolean} */
  required = false

  /**
   * @param {string} name
   * @param {import('json-schema').JSONSchema4} schema
   * @param {YamlNode | null} parent
   */
  constructor(parent, schema, name, depth) {
    this.parent = parent
    this.schema = schema
    this.name = name
    this.depth = depth
    if (parent) {
      parent.children.push(this)
    }

    if (!schema.deprecated && parent?.isPropertyRequired(name)) {
      this.setRequired()
    }
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  isPropertyRequired(name) {
    if (this.schema.type != 'object') {
      return false
    }
    return Array.isArray(this.schema.required) && this.schema.required.includes(name)
  }

  setRequired() {
    this.required = true
    if (this.parent) {
      this.parent.setRequired()
    }
  }

  /**
   * @params {string[]} output
   * @params {boolean} isArrayItem
   * @params {boolean} isObjectProperty
   */
  render(output, isArrayItem = false, isObjectProperty = false) {
    this.renderComment(output, isArrayItem, isObjectProperty)
    this.#renderNode(output, isArrayItem, isObjectProperty)
  }

  /**
   * @params {string[]}
   * @params {boolean} isArrayItem
   * @params {boolean} isObjectProperty
   */
  renderComment(output, isArrayItem, isObjectProperty) {
    /* @type {string[][]} */
    const sections = []
    if (this.schema.description) {
      sections.push(this.schema.description.split(/\n/))
    }
    if (typeof this.schema.default != 'undefined') {
      sections.push([`default: ${this.#stringifyValue(this.schema.default)}`])
    }
    const isNumberString = this.schema.type == 'number' || this.schema.type == 'integer' || this.schema.type == 'string'
    if (Array.isArray(this.schema.examples) && (!isNumberString || this.schema.examples.length > 1)) {
      sections.push([
        (this.schema.examples.length > 1 ? 'examples:' : 'example:'),
        ...this.schema.examples.map(example => `  * ${this.#stringifyValue(example)}`)
      ])
    }

    const depth = Math.max(0, this.depth - (isArrayItem ? 1 : 0))
    const prefix = YamlNode.IDENT.repeat(depth) + '#'

    const lines = []
    if (this.schema.deprecated) {
      lines.push(`${prefix} *deprecated*`)
    }
    sections.forEach((section, i) => {
      if (i > 0) {
        lines.push(prefix)
      }
      section.forEach(line => {
        lines.push(`${prefix} ${line}`.replace(/\s+$/, ''))
      })
    })

    if (isArrayItem && isObjectProperty && lines.length > 0) {
      lines[0] = lines[0].replace(prefix, prefix + ` [${this.name} property]`)
    }

    // add extra empty comment lines for better readability for larger objects/arrays
    const isObjectOrArray = this.schema.type == 'object' || this.schema.type == 'array'
    if (isObjectOrArray && (sections.length > 1 || lines.length > 4)) {
      lines.unshift(prefix)
    }
    if (isObjectOrArray && (lines.length > 6)) {
      lines.push(prefix)
    }

    output.push(...lines)
  }

  /**
   * @params {string[]} output
   * @params {boolean} isArrayItem
   * @params {boolean} isObjectProperty
   */
  #renderNode(output, isArrayItem, isObjectProperty) {
    const hash = this.required ? '' : '#'
    const depth = isArrayItem ? Math.max(0, this.depth - 1) : this.depth
    const prefix = isArrayItem ? YamlNode.IDENT.repeat(depth) + hash + '- ' : YamlNode.IDENT.repeat(depth) + hash

    if (this.schema.type == 'object') {
      /* @type string[] */
      const propOutput = []
      this.children
        .sort((a, b) => a.required == b.required ? 0 : (a.required ? -1 : 1))
        .forEach((child, i) => child.render(propOutput, isArrayItem && i == 0, true))

      if (isArrayItem) {
        if (!propOutput.length) {
          output.push(prefix + '{}')
          return
        }

        output.push(...propOutput)
        return
      }

      if (propOutput.length) {
        output.push(`${prefix}${this.name}:`)
        output.push(...propOutput)
        return
      }

      output.push(`${prefix}${this.name}: {}`)
      return
    }

    if (this.schema.type == 'array') {
      /* @type string[] */
      const itemOutput = []
      this.children.forEach(child => child.render(itemOutput, true, false))

      if (itemOutput.length) {
        output.push(`${prefix}${this.name}:`)
        output.push(...itemOutput)
        return
      }

      output.push(`${prefix}${this.name}: []`)
      return
    }

    if (this.schema.enum) {
      const values = []
      for (const value of this.schema.enum) {
        values.push(this.#stringifyValue(value))
      }

      if (isArrayItem && !isObjectProperty) {
        for (const value of values) {
          output.push(prefix + this.#stringifyValue(value))
        }
        return
      }

      const defaultValue = this.#getDefaultValue()
      output.push(`${prefix}${this.name}: ${defaultValue} # one of: ${values.join(', ')}`)
      return
    }

    if (this.schema.type == 'boolean' || this.schema.type == 'number' || this.schema.type == 'integer' || this.schema.type == 'string') {
      if (isObjectProperty) {
        output.push(`${prefix}${this.name}: ${this.#getDefaultValue()}`)
        return
      }

      if (typeof this.schema.default != 'undefined' || this.schema.examples?.length) {
        output.push(prefix + this.#getDefaultValue())
        return
      }

      output.push(prefix + '...any ' + this.schema.type)
      return
    }

    if (this.schema.const) {
      if (isArrayItem) {
        output.push(prefix + this.#stringifyValue(this.schema.const))
        return
      }

      output.push(`${prefix}${this.name}: ${this.#stringifyValue(this.schema.const)}`)
      return
    }

    if (Array.isArray(this.schema.oneOf || this.schema.allOf || this.schema.anyOf) && (isArrayItem || isObjectProperty)) {
      this.children.forEach(child => child.render(output, isArrayItem, isObjectProperty))
      return
    }
  }

  #stringifyValue(value) {
    if (typeof value == 'boolean' || typeof value == 'number') {
      return String(value)
    }
    if (typeof value == 'string' && value.match(/[~/A-Za-z][-_./A-Za-z0-9]*/)) {
      return value
    }
    return JSON.stringify(value)
  }

  #getDefaultValue() {
    return typeof this.schema.default != 'undefined' ? this.#stringifyValue(this.schema.default) :
      Array.isArray(this.schema.examples) && this.schema.examples.length ? this.#stringifyValue(this.schema.examples[0]) :
      Array.isArray(this.schema.enum) ? this.#stringifyValue(this.schema.enum[0]) :
      this.schema.type == 'boolean' ? 'true' :
      this.schema.type == 'number' || this.schema.type == 'integer' ? '0' :
      this.schema.type == 'string' ? '""' :
      this.schema.type
  }
}
