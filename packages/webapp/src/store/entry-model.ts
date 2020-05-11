import { Action, action, thunk, Thunk } from 'easy-peasy';
import { parse } from '../query/parse';
import { createFilter } from '../query/ast';

export interface Entry {
  id: string;
  type: string;
  date: string;
  year: number;
}

export interface Search {
  type: 'none' | 'year' | 'query';
  revert: boolean;
  value: any;
}

export interface EntryModel {
  allEntries: Entry[];
  entries: Entry[];
  query: Search;
  addEntries: Thunk<EntryModel, Entry[]>;
  setEntries: Action<EntryModel, Entry[]>;
  search: Thunk<EntryModel, Search>;
}

const execQuery = async (entries: Entry[], query: String) => {
  const promise = new Promise<Entry[]>((resolve, reject) => {
    if (!query) {
      resolve(entries);
    }

    console.log(`search for ${query}`);
    parse(query, (err, ast) => {
      if (err) {
        console.log(`Parse error result ${err}, ${ast}`);
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

const doSearch = async (entries, query) => {
  if (query.type == 'query') {
    entries = await execQuery(entries, query.value);
  } else if (query.type == 'year') {
    entries = entries.filter(entry => entry.year == query.value)
  } else {
    entries = entries;
  }
  if (query.revert) {
    entries.sort((a, b) => -1);
  }
  return entries;
}

export const entryModel : EntryModel = {
  allEntries: [],
  entries: [],
  query: { type: 'none', value: null, revert: false },
  addEntries: thunk((actions, payload, {getState}) => {
    const state = getState();
    state.allEntries = state.allEntries.concat(payload);
    state.allEntries.sort((a, b) => a.date < b.date ? 1 : -1);
    actions.search(state.query);
  }),
  search: thunk(async (actions, query, {getState}) => {
    const state = getState();
    const entries = await doSearch([...state.allEntries], query);
    console.log('exec Query', entries);
    state.query = query;
    state.entries = entries;
  }),
  setEntries: action((state, payload) => {
    console.log('set entries', payload);
    state.entries = payload;
  }),
};
