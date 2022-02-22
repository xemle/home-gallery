import { applyEvents, Taggable } from './apply-events';
import { expect } from 'chai';
import 'mocha';
import { Event } from './models';

describe('applyEvents()', () => {
  it('should add one tag', () => {
    const entries: Map<String, Taggable> = new Map().set('1', {});
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
    expect(result).to.eql([{updated: '2022-02-22', tags: ['foo'], appliedEventIds: ['5']}]);
    expect(entries.get('1')).to.eql(result[0]);
  });

  it('should add two tags', () => {
    const entries: Map<String, Taggable> = new Map().set('1', {updated: '2022-03-06'});
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
    expect(result).to.eql([{updated: '2022-03-06', tags: ['foo', 'bar'], appliedEventIds: ['6']}]);
    expect(entries.get('1')).to.eql(result[0]);
  });

  it('should remove one tag', () => {
    const entries: Map<String, Taggable> = new Map().set('1', {updated: '2022-02-22', tags: ['foo', 'bar']});
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
    expect(result).to.eql([{updated: '2022-02-22', tags: ['bar'], appliedEventIds: ['7']}]);
    expect(entries.get('1')).to.eql(result[0]);
  });

  it('should remove two tags', () => {
    const entries: Map<String, Taggable> = new Map().set('1', {updated: '2022-01-01', tags: ['foo', 'bar']});
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
    expect(result).to.eql([{updated: '2022-02-22', tags: [], appliedEventIds: ['8']}]);
    expect(entries.get('1')).to.eql(result[0]);
  });

  it('should not apply event', () => {
    const entries: Map<String, Taggable> = new Map().set('1', {updated: '2022-01-01', tags: ['foo'], appliedEventIds: ['9']});
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
    expect(result).to.eql([]);
    expect(entries.get('1')).to.eql({updated: '2022-01-01', tags: ['foo'], appliedEventIds: ['9']});
  });

  it('should not add existing tag', () => {
    const entries: Map<String, Taggable> = new Map().set('1', {updated: '2022-01-01', tags: ['foo']});
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
    expect(result).to.eql([]);
    expect(entries.get('1')).to.eql({updated: '2022-01-01', tags: ['foo'], appliedEventIds: ['10']});
  });

  it('should add and remove tag', () => {
    const entries: Map<String, Taggable> = new Map().set('1', {});
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
    expect(result).to.eql([{tags: [], appliedEventIds: ['8']}]);
    expect(entries.get('1')).to.eql(result[0]);
  });

});