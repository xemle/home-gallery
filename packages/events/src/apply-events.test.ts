import t from 'tap'

import { applyEvents } from './apply-events.js';
import { Taggable } from './taggable.js';
import { Event } from './models.js';

t.test('applyEvents()', async t => {
  t.test('should add one tag', async t => {
    const entries: Taggable[] = [{id: '1'}]
    const events: Event[] = [
      {
        type: 'userAction',
        id: '5',
        date: '2022-02-22',
        targetIds: ['1'],
        actions: [
          {
            action: 'addTag',
            value: 'foo'
          }
        ]
      }
    ]
    const result = applyEvents(entries, events);
    t.same(result, [{id: '1', updated: '2022-02-22', tags: ['foo'], appliedEventIds: ['5']}]);
    t.same(entries[0], result[0]);
  });

  t.test('should add one tag to tow entries with same id', async t => {
    const entries: Taggable[] = [{id: '1'}, {id: '1'}]
    const events: Event[] = [
      {
        type: 'userAction',
        id: '5',
        date: '2022-02-22',
        targetIds: ['1'],
        actions: [
          {
            action: 'addTag',
            value: 'foo'
          }
        ]
      }
    ]
    const result = applyEvents(entries, events);
    t.same(result, [{id: '1', updated: '2022-02-22', tags: ['foo'], appliedEventIds: ['5']}, {id: '1', updated: '2022-02-22', tags: ['foo'], appliedEventIds: ['5']}]);
    t.same(entries[0], result[0]);
  });

  t.test('should add two tags', async t => {
    const entries: Taggable[] = [{id:'1', updated: '2022-03-06'}];
    const events: Event[] = [
      {
        type: 'userAction',
        id: '6',
        date: '2022-02-22',
        targetIds: ['1'],
        actions: [
          {
            action: 'addTag',
            value: 'foo'
          },
          {
            action: 'addTag',
            value: 'bar'
          }
        ]
      }
    ]
    const result = applyEvents(entries, events);
    t.same(result, [{id: '1', updated: '2022-03-06', tags: ['foo', 'bar'], appliedEventIds: ['6']}]);
    t.same(entries[0], result[0]);
  });

  t.test('should remove one tag', async t => {
    const entries: Taggable[] = [{id: '1', updated: '2022-02-22', tags: ['foo', 'bar']}];
    const events: Event[] = [
      {
        type: 'userAction',
        id: '7',
        targetIds: ['1'],
        actions: [
          {
            action: 'removeTag',
            value: 'foo'
          }
        ]
      }
    ]
    const result = applyEvents(entries, events);
    t.same(result, [{id: '1', updated: '2022-02-22', tags: ['bar'], appliedEventIds: ['7']}]);
    t.same(entries[0], result[0]);
  });

  t.test('should remove two tags', async t => {
    const entries: Taggable[] = [{id: '1', updated: '2022-01-01', tags: ['foo', 'bar']}];
    const events: Event[] = [
      {
        type: 'userAction',
        id: '8',
        date: '2022-02-22',
        targetIds: ['1'],
        actions: [
          {
            action: 'removeTag',
            value: 'foo'
          },
          {
            action: 'removeTag',
            value: 'bar'
          }
        ]
      }
    ]
    const result = applyEvents(entries, events);
    t.same(result, [{id: '1', updated: '2022-02-22', tags: [], appliedEventIds: ['8']}]);
    t.same(entries[0], result[0]);
  });

  t.test('should not apply event', async t => {
    const entries: Taggable[] = [{id: '1', updated: '2022-01-01', tags: ['foo'], appliedEventIds: ['9']}];
    const events: Event[] = [
      {
        type: 'userAction',
        id: '9',
        date: '2022-02-22',
        targetIds: ['1'],
        actions: [
          {
            action: 'removeTag',
            value: 'foo'
          }
        ]
      }
    ]
    const result = applyEvents(entries, events);
    t.same(result, []);
    t.same(entries[0], {id: '1', updated: '2022-01-01', tags: ['foo'], appliedEventIds: ['9']});
  });

  t.test('should not add existing tag', async t => {
    const entries: Taggable[] = [{id: '1', updated: '2022-01-01', tags: ['foo']}];
    const events: Event[] = [
      {
        type: 'userAction',
        date: '2022-02-22',
        id: '10',
        targetIds: ['1'],
        actions: [
          {
            action: 'addTag',
            value: 'foo'
          }
        ]
      }
    ]
    const result = applyEvents(entries, events);
    t.same(result, []);
    t.same(entries[0], {id: '1', updated: '2022-01-01', tags: ['foo'], appliedEventIds: ['10']});
  });

  t.test('should add and remove tag', async t => {
    const entries: Taggable[] = [{id: '1'}];
    const events: Event[] = [
      {
        type: 'userAction',
        id: '8',
        targetIds: ['1'],
        actions: [
          {
            action: 'addTag',
            value: 'foo'
          },
          {
            action: 'removeTag',
            value: 'foo'
          }
        ]
      }
    ]
    const result = applyEvents(entries, events);
    t.same(result, [{id: '1', tags: [], appliedEventIds: ['8']}]);
    t.same(entries[0], result[0]);
  });

  t.test('should change only one entry', async t => {
    const entries: Taggable[] = [{id: '1'}];
    const events: Event[] = [
      {
        type: 'userAction',
        id: '8',
        targetIds: ['1'],
        actions: [
          {
            action: 'addTag',
            value: 'foo'
          }
        ]
      },
      {
        type: 'userAction',
        id: '9',
        targetIds: ['1'],
        actions: [
          {
            action: 'addTag',
            value: 'bar'
          }
        ]
      }
    ]
    const result = applyEvents(entries, events);
    t.same(result.length, 1);
  });
});