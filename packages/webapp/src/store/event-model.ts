import { Thunk, thunk } from 'easy-peasy';
import { Entry } from './entry-model';
import { StoreModel } from './store';

export interface Event {
  type: string;
  id: string;
  date: string;
  targetIds: string[];
  actions: EventAction[];
}

export interface EventAction {
  action: string;
  value: any;
}

export interface EventModel {
  events: Event[];

  initEvents: Thunk<EventModel, Event[]>;
  addEvent: Thunk<EventModel, Event>;
  applyEvents: Thunk<EventModel, Event[], any, StoreModel>;
}

const applyEventAction = (entry: Entry, action: EventAction) => {
  let resetTextCache = false;
  switch (action.action) {
    case 'addTag': {
      if (!entry.tags) {
        entry.tags = [];
      }
      if (entry.tags.indexOf(action.value) < 0) {
        entry.tags.push(action.value);
        resetTextCache = true;
      }
      break;
    }
    case 'removeTag': {
      if (!entry.tags || !entry.tags.length) {
        return
      }
      const index = entry.tags.indexOf(action.value);
      if (index >= 0) {
        entry.tags.splice(index, 1);
        resetTextCache = true;
      }
      break;
    }
  }
  if (resetTextCache) {
    entry.textCache = false;
  }
}

const applyEvents = (entries: Map<String, Entry>, events: Event[]) => {
  const t0 = Date.now();
  let entryCount = 0;
  let actionCount = 0;
  events.forEach(event => {
    const eventId = event.id;
    if (event.type != 'userAction' || !event.targetIds || !event.targetIds.length || !event.actions || !event.actions.length) {
      return;
    }
    const targetEntries = event.targetIds
      .map(entryId => entries.get(entryId))
      .filter(entry => !!entry)
      .filter(entry => !entry.appliedEventIds || entry.appliedEventIds.indexOf(eventId) < 0);

    targetEntries.forEach(entry => {
      event.actions.forEach(action => {
        applyEventAction(entry, action);
      });

      if (!entry.appliedEventIds) {
        entry.appliedEventIds = [];
      }
      entry.appliedEventIds.push(event.id);
      actionCount += event.actions.length;
    })
    entryCount += targetEntries.length;
  })
  console.log(`Applied ${events.length} events to ${entryCount} entries with ${actionCount} actions in ${Date.now() - t0}ms`);
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
    applyEvents(allEntries as Map<String, Entry>, events);
    getStoreActions().search.refresh();
  }),
};
