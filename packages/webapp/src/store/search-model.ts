import { Thunk, thunk } from 'easy-peasy';
import { parse } from '../query/parse';
import { createFilter } from '../query/ast';
import { StoreModel } from './store';
import { Entry } from './entry-model';

export interface Search {
  type: 'none' | 'year' | 'query';
  revert: boolean;
  value: any;
}

export interface SearchModel {
  query: Search;

  search: Thunk<SearchModel, Search, any, StoreModel>;
  refresh: Thunk<SearchModel, any, any, StoreModel>;
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
        textFn: (v) => {
          if (!v.textCache) {
            v.textCache = [
              v.id.substring(0, 10),
              v.type,
              v.date,
              v.make || '',
              v.model || '',
              v.files[0].filename,
              v.country || '',
              v.state || '',
              v.city || ''
            ]
            .concat(v.tags || [])
            .join(' ')
            .toLowerCase();
          }
          return v.textCache;
        }
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

  entries.sort((a, b) => a.date < b.date ? 1 : -1);
  if (query.revert) {
    entries.sort((a, b) => -1);
  }
  return entries;
}

export const searchModel : SearchModel = {
  query: { type: 'none', value: null, revert: false },

  search: thunk(async (actions, query, {getState}) => {
    const state = getState();
    state.query = query;
    actions.refresh();
  }),
  refresh: thunk(async (action, _, { getState, getStoreState }) => {
    const state = getState();
    const allEntries = Array.from(getStoreState().entries.allEntries.values());
    const entries = await doSearch(allEntries, state.query);
    const storeState = getStoreState();
    storeState.entries.entries = entries;
  })
  
};
