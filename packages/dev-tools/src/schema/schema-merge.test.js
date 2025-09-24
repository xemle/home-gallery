import { test } from 'node:test';
import assert from 'node:assert/strict';

import { insertSchema } from './schema-merge.js'

test('insertSchema()', async t => {
  await t.test('basic', async () => {
    const target = {
      type: 'object',
      properties: {}
    }

    insertSchema(target, {
      type: 'string',
    }, ['foo'])


    assert.deepEqual(target, {
      type: 'object',
      properties: {
        foo: {
          type: 'string'
        }
      }
    })
  })

  await t.test('nested', async () => {
    const target = {
      type: 'object',
      properties: {}
    }

    insertSchema(target, {
      type: 'string',
    }, ['foo', 'bar'])


    assert.deepEqual(target, {
      type: 'object',
      properties: {
        foo: {
          type: 'object',
          properties: {
            bar: {
              type: 'string'
            }
          }
        }
      }
    })
  })


  await t.test('Root merge', async () => {
    const target = {
      type: 'object',
      properties: {}
    }

    insertSchema(target, {
      type: 'object',
      properties: {
        foo: {
          type: 'string'
        }
      }
    }, [])


    assert.deepEqual(target, {
      type: 'object',
      properties: {
        foo: {
          type: 'string'
        }
      }
    })
  })

  await t.test('Invalid merge on root', async () => {
    const target = {
      type: 'object',
      properties: {}
    }

    insertSchema(target, {
      type: 'string',
    }, [])


    assert.deepEqual(target, {
      type: 'object',
      properties: {
      }
    })
  })
})
