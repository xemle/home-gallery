import { Thunk, thunk } from 'easy-peasy';
import { StoreModel } from './store';
import { Entry } from './entry-model';

import { filterEntriesByQuery } from '@home-gallery/query';
import { ENGINE_METHOD_RAND } from 'constants';

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

const execQuery = async (entries: Entry[], query: String) => {
  const promise = new Promise<Entry[]>((resolve) => {
    const t0 = Date.now();
    filterEntriesByQuery(entries, query, (err, filtered) => {
      if (err) {
        console.log(`Could not build query of ${query}: ${err}`);
        return resolve(entries);
      }
      console.log(`Found ${filtered.length} of ${entries.length} entries by query '${query}' in ${Date.now() - t0}ms`);
      resolve(filtered);
    })
  })
  return promise;
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

const byDate = (a, b) => a.date < b.date ? 1 : -1;
const byDateRev = (a, b) => a.date < b.date ? -1 : 1;

const doSearch = async (allEntries: Map<String, Entry>, query) => {
  let entries = Array.from(allEntries.values())
  let defaultSortOrder = true;
  let reverse = false;

  if (query.type == 'query') {
    entries = await execQuery(entries, query.value);
  } else if (query.type == 'year') {
    entries = entries.filter(entry => entry.year == query.value)
    reverse = true
  } else if (query.type == 'similar') {
    const id = query.value;
    const seedEntry = allEntries.get(id);
    entries = execSimilar(entries, seedEntry.similarityHash);
    defaultSortOrder = false;
  } else if (query.type == 'faces') {
    const { id, faceIndex } = query.value;
    const seedEntry = allEntries.get(id);
    const descriptor = seedEntry?.faces[faceIndex]?.descriptor;
    entries = execFaces(entries, descriptor);
    defaultSortOrder = false;
  }
  if (query.query) {
    entries = await execQuery(entries, query.query);
  }

  if (defaultSortOrder) {
    entries.sort(reverse ? byDateRev : byDate);
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
