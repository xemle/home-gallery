import { test } from 'node:test';
import assert from 'node:assert/strict';

import { renderYaml } from './schema-to-yaml.js'

test('renderYaml()', async t => {
  await t.test('scalar', async t => {
    await t.test('boolean', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            type: 'boolean'
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '#foo: true')
    })
  })

  await t.test('object', async t => {
    await t.test('nested object', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            properties: {
              bar: {
                type: 'boolean'
              }
            }
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '#foo:\n  #bar: true')
    })

    await t.test('required property first', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            properties: {
              bar: {
                type: 'boolean'
              },
              baz: {
                type: 'number'
              },
              zoo: {
                type: 'string'
              }
            },
            required: ['baz']
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), 'foo:\n  baz: 0\n  #bar: true\n  #zoo: ""')
    })

    await t.test('const values', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            description: 'Choose between',
            oneOf: [
              {
                description: 'first option',
                const: 'one'
              },
              {
                description: 'second option',
                const: 'two'
              }
            ]
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '# Choose between\n# first option\n#foo: one\n# second option\n#foo: two')
    })
  })

  await t.test('array', async t => {
    await t.test('basic', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: {
              enum: ['one', 'two']
            }
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '#foo:\n  #- one\n  #- two')
    })

    await t.test('scalar', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '#foo:\n  #- ...any string')
    })

    await t.test('oneOf', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: {
              anyOf: [
                { enum: ['one', 'two'] },
                { enum: ['three'], description: 'three description' },
                { type: 'string', minLength: 0 }
              ]
            }
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '#foo:\n  #- one\n  #- two\n  # three description\n  #- three\n  #- ...any string')
    })

    await t.test('object item', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: {
              type: 'object',
              description: 'description',
              properties: {
                bar: {
                  type: 'boolean'
                },
                baz: {
                  type: 'number'
                }
              }
            }
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '#foo:\n  # description\n  #- bar: true\n    #baz: 0')
    })

    await t.test('object item array', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: {
              type: 'object',
              description: 'description',
              properties: {
                bar: {
                  default: 8080,
                  type: 'number'
                },
                baz: {
                  type: 'array',
                  items: {
                    anyOf: [
                      { const: 'const' },
                      { type: 'number' }
                    ]
                  }
                }
              }
            }
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '#foo:\n  # description\n  # [bar property] default: 8080\n  #- bar: 8080\n    #baz:\n      #- const\n      #- ...any number')
    })
  })

  await t.test('meta', async t => {
    await t.test('$schema', async () => {
      const output = []


      renderYaml({
        $id: 'https://schema.local/schema.json',
        type: 'object',
        properties: {
          foo: {
            type: 'boolean'
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '# yaml-language-server: $schema=https://schema.local/schema.json\n#foo: true')
    })

    await t.test('title should be used only as typescript interface name', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            title: 'fooFlag',
            type: 'boolean'
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '#foo: true')
    })

    await t.test('head meta', async () => {
      const output = []

      renderYaml({
        description: 'Root description',
        type: 'object',
        properties: {
          foo: {
            type: 'boolean'
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '# Root description\n\n\n#foo: true')
    })

    await t.test('description', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            description: 'foo flag with\nmultiline description',
            type: 'boolean',
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '# foo flag with\n# multiline description\n#foo: true')
    })

    await t.test('default', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            enum: ['one', 'two', 'three'],
            default: 'two'
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '# default: two\n#foo: two # one of: one, two, three')
    })

    await t.test('examples (one as value for scalar)', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          title: {
            type: 'string',
            examples: [
              'My Gallery'
            ]
          },
          port: {
            type: 'number',
            examples: [
              8080
            ]
          },
          debug: {
            type: 'boolean',
            examples: [
              true
            ]
          },
          limit: {
            type: 'number',
            examples: [
              50,
              100
            ]
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '#title: My Gallery\n#port: 8080\n#debug: true\n# examples:\n#   * 50\n#   * 100\n#limit: 50')
    })

    await t.test('examples', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            examples: [
              'first is default',
              'second'
            ]
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '# examples:\n#   * first is default\n#   * second\n#foo: first is default')
    })

    await t.test('required', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            type: 'number'
          }
        },
        required: ['foo']
      }, output)


      assert.deepEqual(output.join('\n'), 'foo: 0')
    })

    await t.test('deprecated', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          foo: {
            type: 'number',
            deprecated: true
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '# *deprecated*\n#foo: 0')
    })

    await t.test('full meta', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          port: {
            type: 'number',
            description: 'Listen port\n\nSocket port\nof the server',
            default: 3000,
            examples: [
              8080,
              1234
            ]
          }
        },
        required: ['port']
      }, output)


      assert.deepEqual(output.join('\n'), '# Listen port\n#\n# Socket port\n# of the server\n#\n# default: 3000\n#\n# examples:\n#   * 8080\n#   * 1234\nport: 3000')
    })

    await t.test('deprecated over required', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          port: {
            type: 'number',
            default: 3000,
            required: true,
            deprecated: true,
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '# *deprecated*\n# default: 3000\n#port: 3000')
    })

  })

  await t.test('full', async t => {

    await t.test('spacing first level for object', async () => {
      const output = []


      renderYaml({
        type: 'object',
        description: 'Global configuration',
        properties: {
          basePath: {
            type: 'string',
            default: '~'
          },
          version: {
            type: 'number',
            default: 1
          },
          server: {
            type: 'object',
            description: 'server configuration',
            properties: {
              publicUrl: {
                type: 'string',
                default: 'http://localhost:3000'
              },
              port: {
                type: 'number',
                default: 3000
              }
            }
          },
          debug: {
            type: 'boolean',
            default: false
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '# Global configuration\n\n\n# default: ~\n#basePath: ~\n# default: 1\n#version: 1\n\n# server configuration\n#server:\n  # default: http://localhost:3000\n  #publicUrl: http://localhost:3000\n  # default: 3000\n  #port: 3000\n\n# default: false\n#debug: false')
    })

    await t.test('spacing first level for arrays', async () => {
      const output = []


      renderYaml({
        type: 'object',
        properties: {
          version: {
            type: 'number',
            default: 1
          },
          sources: {
            type: 'array',
            items: {
              anyOf: [
                {
                  description: 'Simple path to source directory',
                  type: 'string',
                  examples: ['/home/me/Pictures']
                },
                {
                  type: 'object',
                  description: 'Detailed source setting',
                  properties: {
                    path: {
                      description: 'Path of source directory',
                      type: 'string',
                      examples: ['/mnt/media/photos']
                    },
                    downloadable: {
                      type: 'boolean',
                      default: false
                    }
                  }
                }
              ],
            }
          },
          debug: {
            type: 'boolean',
            default: false
          }
        }
      }, output)


      assert.deepEqual(output.join('\n'), '# default: 1\n#version: 1\n\n#sources:\n  # Simple path to source directory\n  #- /home/me/Pictures\n  # Detailed source setting\n  # [path property] Path of source directory\n  #- path: /mnt/media/photos\n    # default: false\n    #downloadable: false\n\n# default: false\n#debug: false')
    })

  })
})
