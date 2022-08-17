import { Thunk, thunk } from 'easy-peasy';
import { Entry } from './entry-model';
import { StoreModel } from './store';

import { applyEvents, Event, EventAction } from '@home-gallery/events';

const lruAdd = (list: string[], item: string, size: number = 50) => {
  const index = list.indexOf(item);
  if (index > 0) {
    list.splice(index, 1)
    list.unshift(item);
  } else if (index < 0 && list.length < size) {
    list.unshift(item);
  } else if (index < 0) {
    list.pop()
    list.unshift(item)
  }
}

const getEventTags = events => events
  .filter(event => event.type == 'userAction')
  .map(event => event.actions.filter(a => a.action == 'addTag'))
  .reduce((all, actions) => all.concat(actions), [])
  .map(action => action.value);

export interface EventModel {
  events: Event[];
  recentTags: [];

  initEvents: Thunk<EventModel, Event[]>;
  addEvent: Thunk<EventModel, Event>;
  applyEvents: Thunk<EventModel, Event[], any, StoreModel>;
}

export const eventModel : EventModel = {
  events: [],
  recentTags: [],

  initEvents: thunk(async (actions, payload, {getState}) => {
    const state = getState();
    state.events = payload;
    actions.applyEvents(state.events);
  }),
  addEvent: thunk((actions, payload, {getState}) => {
    const state = getState();
    state.events.push(payload);
    actions.applyEvents([payload]);
  }),
  applyEvents: thunk((actions, events, {getStoreState, getStoreActions}) => {
    const storeState = getStoreState();
    const allEntries = storeState.entries.allEntries;
    const t0 = Date.now();
    getEventTags(events).forEach(tag => lruAdd(storeState.events.recentTags, tag));
    const changedEntries = applyEvents(allEntries, events);
    changedEntries.forEach((entry: any) => entry.textCache = false)
    console.log(`Applied ${events.length} events and updated ${changedEntries.length} entries in ${Date.now() - t0}ms`);
    getStoreActions().search.refresh();
  }),
};
