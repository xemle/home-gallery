import { Action, action } from 'easy-peasy';

export interface Entry {
  id: string;
}

export interface EntryModel {
  entries: Entry[];
  load: Action<EntryModel, Entry[]>;
}

export const entryModel : EntryModel = {
  entries: [],
  load: action((state, payload) => {
    state.entries = state.entries.concat(payload);
  })
};
