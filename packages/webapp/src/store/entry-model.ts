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
  id2Entries: Map<String, Entry>;
  allEntries: Entry[];
  entries: Entry[];

  addEntries: Thunk<EntryModel, Entry[], any, StoreModel>;
  setEntries: Action<EntryModel, Entry[]>;
}

export const entryModel : EntryModel = {
  id2Entries: new Map<String, Entry>(),
  allEntries: [],
  entries: [],

  addEntries: thunk((actions, payload, {getState, getStoreActions}) => {
    const state = getState();
    const id2Entries = state.id2Entries;
    payload.forEach(entry => {
      id2Entries.set(entry.shortId, entry);
    })
    state.allEntries = Array.from(id2Entries.values())
    getStoreActions().search.refresh();
  }),

  setEntries: action((state, payload) => {
    state.entries = payload;
  }),
};
