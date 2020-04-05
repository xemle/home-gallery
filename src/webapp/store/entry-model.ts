import { Action, action, thunk, Thunk } from 'easy-peasy';
import { parse } from '../query/parse';
import { createFilter } from '../query/ast';

export interface Entry {
  id: string;
  type: string;
  date: string;
  year: number;
}

export interface EntryModel {
  allEntries: Entry[];
  entries: Entry[];
  query: String;
  addEntries: Thunk<EntryModel, Entry[]>;
  setEntries: Action<EntryModel, Entry[]>;
  showAll: Action<EntryModel>;
  setYear: Action<EntryModel, number>;
  search: Thunk<EntryModel, String>;
}

const execQuery = async (entries: Entry[], query: String) => {
  const promise = new Promise<Entry[]>((resolve, reject) => {
    console.log(`search for ${query}`);
    parse(query, (err, ast) => {
      console.log(`parse result ${err}, ${ast}`);
      if (err) {
        return resolve(entries);
      }
      const options = {
        textFn: (v) => `${v.id.substring(0, 10)} ${v.type} ${v.date} ${v.make} ${v.model} ${v.files[0].filename}`.toLowerCase()
      }
      createFilter(ast, options, (err, queryFn) => {
        console.log(`filter result ${err}, ${queryFn}`);
        if (err) {
          return resolve(entries);
        }
        const result : Entry[] = queryFn(entries);
        resolve(result);
      })
    });  
  })
  return promise;
}

export const entryModel : EntryModel = {
  allEntries: [],
  entries: [],
  query: '',
  addEntries: thunk((actions, payload, {getState}) => {
    const state = getState();
    state.allEntries = state.allEntries.concat(payload);
    state.allEntries.sort((a, b) => a.date < b.date ? 1 : -1);
    actions.search(state.query);
  }),
  search: thunk(async (actions, payload, {getState}) => {
    const allEntries = getState().allEntries;
    const entries = await execQuery(allEntries, payload);
    console.log('exec Query', entries);
    actions.setEntries(entries);
  }),
  setEntries: action((state, payload) => {
    console.log('set entries', payload);
    state.entries = payload;
  }),
  showAll: action((state) => {
    state.entries = [...state.allEntries];
  }),
  setYear: action((state, year) => {
    state.entries = state.allEntries.filter(entry => entry.year == year);
  })
};
