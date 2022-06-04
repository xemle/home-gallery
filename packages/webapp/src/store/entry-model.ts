import { Action, action, Thunk, thunk } from 'easy-peasy';
import { StoreModel } from './store';

export interface Entry {
  id: string;
  type: string;
  date: string;
  year: number;
  width: number;
  height: number;
  tags: string[];
  appliedEventIds?: string[],
  textCache?: string | false;
  similarityHash: string;
  faces?: any[],
}

export interface EntryModel {
  allEntries: Map<String, Entry>;
  entries: Entry[];

  addEntries: Thunk<EntryModel, Entry[], any, StoreModel>;
  setEntries: Action<EntryModel, Entry[]>;
}

export const entryModel : EntryModel = {
  allEntries: new Map<String, Entry>(),
  entries: [],

  addEntries: thunk((actions, payload, {getState, getStoreActions}) => {
    const state = getState();
    const allEntries = state.allEntries;
    payload.forEach(entry => {
      allEntries.set(entry.shortId, entry);
    })
    getStoreActions().search.refresh();
  }),

  setEntries: action((state, payload) => {
    state.entries = payload;
  }),
};
