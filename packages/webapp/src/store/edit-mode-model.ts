import { Action, action, Thunk, thunk } from 'easy-peasy';
import { StoreModel } from './store';

export enum ViewMode {
  VIEW,
  EDIT
}

export interface IdMap {
  [key: string]: boolean;
}

export interface EditModeModel {
  viewMode: ViewMode;
  selectedIdMap: IdMap;
  lastSelectedId: string;

  setViewMode: Action<EditModeModel, ViewMode>;
  selectAll: Thunk<EditModeModel, any, any, StoreModel>;
  invert: Thunk<EditModeModel, any, any, StoreModel>;
  setIds: Thunk<EditModeModel, string[], any, StoreModel>;
  addIds: Action<EditModeModel, string[]>;
  toggleId: Action<EditModeModel, string>;
  toggleRange: Thunk<EditModeModel, string, any, StoreModel>;
  removeIds: Action<EditModeModel, string[]>;
  reset: Action<EditModeModel>;
}

const getSelectionRange = (entries, firstId, lastId) => {
  let startIndex = -1;
  let endIndex = -1;

  for (var i = 0; i < entries.length; i++) {
    const entryId = entries[i].id;
    if (entryId == firstId && startIndex < 0) {
      startIndex = i;
    } else if (entryId === lastId && startIndex < 0) {
      startIndex = i;
    } else if (entryId === firstId && startIndex >= 0) {
      endIndex = i + 1;
      break;
    } else if (entryId === lastId && startIndex >= 0) {
      endIndex = i + 1;
      break;
    }
  }

  return [startIndex, endIndex];
}

const getSelectionRangeIds = (entries, firstId, lastId) => {
  const [start, end] = getSelectionRange(entries, firstId, lastId);
  const ids = [];
  for (var i = start; i < end; i++) {
    ids.push(entries[i].id);
  }
  return ids;
}

export const editModeModel : EditModeModel = {
  viewMode: ViewMode.VIEW,
  selectedIdMap: {},
  lastSelectedId: '',

  setViewMode: action((state, mode) => {
    state.viewMode = mode;
  }),
  selectAll: thunk(async (actions, _, {getStoreState}) => {
    const entryModel = getStoreState().entries;
    const ids = entryModel.entries.map(entry => entry.id);
    actions.addIds(ids);
  }),
  invert: thunk(async (actions, _, {getState, getStoreState}) => {
    const selectedIdMap = getState().selectedIdMap;
    const ids = getStoreState().entries.entries.map(entry => entry.id);

    const addIds = ids.filter(id => !selectedIdMap[id]);
    const removeIds = ids.filter(id => selectedIdMap[id]);
    actions.addIds(addIds);
    actions.removeIds(removeIds);
  }),
  setIds: thunk(async (actions, ids) => {
    actions.reset();
    actions.addIds(ids);
  }),
  addIds: action((state, ids) => {
    ids.forEach(id => {
      if (!state.selectedIdMap[id]) {
        state.selectedIdMap[id] = true;
      }
    })
  }),
  removeIds: action((state, ids) => {
    const selectedIds = state.selectedIdMap;
    ids.forEach(id => delete selectedIds[id]);
  }),
  toggleId: action((state, id) => {
    const selectedIdMap = state.selectedIdMap;
    const isSelected = selectedIdMap[id];
    if (isSelected) {
      delete selectedIdMap[id];
    } else {
      selectedIdMap[id] = true;
    }
    state.lastSelectedId = id;
  }),
  toggleRange: thunk(async (actions, id, {getState, getStoreState}) => {
    const state = getState();
    const lastSelectedId = state.lastSelectedId;
    if (!lastSelectedId) {
      actions.toggleId(id);
      return;
    }
    const selectedIdMap = state.selectedIdMap;
    const isLastSelected = selectedIdMap[lastSelectedId];
    const entries = getStoreState().entries.entries;

    const entryIds = getSelectionRangeIds(entries, lastSelectedId, id);
    state.lastSelectedId = id;

    if (isLastSelected) {
      actions.addIds(entryIds);
    } else {
      actions.removeIds(entryIds);
    }
  }),
  reset: action((state) => {
    state.selectedIdMap = {};
  })
};
