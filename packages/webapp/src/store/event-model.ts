import { Thunk, thunk } from 'easy-peasy';
import { Entry } from './entry-model';
import { StoreModel } from './store';

import { applyEvents, Event } from '@home-gallery/events';

export interface EventModel {
  events: Event[];

  initEvents: Thunk<EventModel, Event[]>;
  addEvent: Thunk<EventModel, Event>;
  applyEvents: Thunk<EventModel, Event[], any, StoreModel>;
}

export const eventModel : EventModel = {
  events: [],

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
    const changedEntries = applyEvents(allEntries as Map<String, Entry>, events);
    changedEntries.forEach((entry: any) => entry.textCache = false)
    console.log(`Applied ${events.length} events and updated ${changedEntries.length} entries in ${Date.now() - t0}ms`);
    getStoreActions().search.refresh();
  }),
};
