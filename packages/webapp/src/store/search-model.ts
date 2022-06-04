import { Thunk, thunk } from 'easy-peasy';
import { StoreModel } from './store';
import { Entry } from './entry-model';

import { filterEntriesByQuery, stringifyAst, stringifyEntry } from '@home-gallery/query';

export interface Search {
  type: 'none' | 'year' | 'query' | 'similar' | 'faces';
  value?: any;
  query?: string;
}

export interface SearchModel {
  query: Search;

  search: Thunk<SearchModel, Search, any, StoreModel>;
  refresh: Thunk<SearchModel, any, any, StoreModel>;
}

const stringifyEntryTextCache = entry => {
  if (!entry.textCache) {
    entry.textCache = stringifyEntry(entry)
  }
  return entry.textCache
}

const execQuery = async (entries: Entry[], query: String) => {
  const t0 = Date.now();
  return filterEntriesByQuery(entries, query, {textFn: stringifyEntryTextCache})
    .then(({entries: filtered, ast}) => {
      console.log(`Found ${filtered.length} of ${entries.length} entries by query '${query}' (resolved to '${stringifyAst(ast)}') in ${Date.now() - t0}ms`);
      return filtered;
    })
    .catch(err => {
      console.log(`Could not build query of ${query}: ${err}`, err);
      return entries;
    })
}

const cosineSimilarity = (a, b) => {
  let denA = 0;
  let denB = 0;
  let num = 0;
  for (let i = 0; i < a.length; i++) {
    let ai = a.charCodeAt(i) & 255;
    let bi = b.charCodeAt(i) & 255;
    for (let j = 0; j < 4; j++) {
      let av = (ai & 3);
      let bv = (bi & 3);
      av = av * av / 9;
      bv = bv * bv / 9;
      num += av * bv;
      denA += av * av;
      denB += bv * bv;

      ai = (ai >> 2);
      bi = (bi >> 2);
    }
  }

  return num / (Math.sqrt(denA) * Math.sqrt(denB));
}

const execSimilar = (entries: Entry[], similarityHash) => {
  if (!similarityHash) {
    return entries
  }
  const t0 = Date.now();
  const comparableEntries = entries.filter(entry => !!entry.similarityHash);
  const t1 = Date.now()
  const similar = comparableEntries.map(entry => {
    return {
      entry,
      similarity: cosineSimilarity(similarityHash, entry.similarityHash)
    }
  })
  .filter(item => item.similarity > 0.5)
  const t2 = Date.now();
  similar.sort((a, b) => (a.similarity - b.similarity) < 0 ? 1 : -1);
  const result = similar.map(s => s.entry);
  const t3 = Date.now();
  console.log(`Similarity search: Took ${t1 - t0}ms to select, ${t2 - t1}ms to calculate, to sort ${t3 - t2}ms, to map ${Date.now() - t3}ms`);
  return result;
}

function euclideanDistance(a, b) {
  const max = Math.min(a.length, b.length);
  let result = 0;
  for (let i = 0; i < max; i++) {
    const diff = a[i] - b[i];
    result += diff * diff;
  }
  return Math.sqrt(result);
}

const uniqBy = (keyFn) => {
  const seen = {};
  return v => {
    const key = keyFn(v);
    if (!seen[key]) {
      seen[key] = true;
      return true;
    }
    return false;
  }
}

const execFaces = (entries: Entry[], descriptor) => {
  if (!descriptor) {
    return entries
  }
  const t0 = Date.now();
  const comparableEntries = entries.filter(entry => entry.faces.length > 0);
  const t1 = Date.now()
  const similar = []
  comparableEntries.forEach(entry => {
    entry.faces.forEach(face => {
      similar.push({
        entry,
        similarity: euclideanDistance(descriptor, face.descriptor)
      })
    })
  })
  const t2 = Date.now();
  similar.sort((a, b) => (b.similarity - a.similarity) < 0 ? 1 : -1);
  const result = similar.map(s => s.entry).filter(uniqBy(v => v.id));
  const t3 = Date.now();
  console.log(`Face search: Took ${t1 - t0}ms to select, ${t2 - t1}ms to calculate, to sort ${t3 - t2}ms, to map ${Date.now() - t3}ms`);
  return result;
}

const byDateDesc = (a, b) => a.date < b.date ? 1 : -1;

const doSearch = async (allEntries: Map<String, Entry>, query) => {
  let entries = Array.from(allEntries.values())
  entries.sort(byDateDesc)

  if (query.type == 'query') {
    entries = await execQuery(entries, query.value);
  } else if (query.type == 'year') {
    entries = await execQuery(entries, `year:${query.value} order by date asc`);
  } else if (query.type == 'similar') {
    const id = query.value;
    const seedEntry = entries.find(entry => entry.id.startsWith(id));
    entries = execSimilar(entries, seedEntry?.similarityHash);
  } else if (query.type == 'faces') {
    const { id, faceIndex } = query.value;
    const seedEntry = entries.find(entry => entry.id.startsWith(id));
    const descriptor = seedEntry?.faces[faceIndex]?.descriptor;
    entries = execFaces(entries, descriptor);
  }
  if (query.query) {
    entries = await execQuery(entries, query.query);
  }

  return entries;
}

export const searchModel : SearchModel = {
  query: { type: 'none' },

  search: thunk(async (actions, query, {getState}) => {
    const state = getState();
    state.query = query;
    actions.refresh();
  }),
  refresh: thunk(async (action, _, { getState, getStoreState }) => {
    const state = getState();
    const allEntries = getStoreState().entries.allEntries;
    const entries = await doSearch(allEntries as Map<String, Entry>, state.query);
    const storeState = getStoreState();
    storeState.entries.entries = entries;
  })
  
};
