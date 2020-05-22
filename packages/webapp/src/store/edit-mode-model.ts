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

  setViewMode: Action<EditModeModel, ViewMode>;
  selectAll: Thunk<EditModeModel, any, any, StoreModel>;
  invert: Thunk<EditModeModel, any, any, StoreModel>;
  setIds: Thunk<EditModeModel, string[], any, StoreModel>;
  addIds: Action<EditModeModel, string[]>;
  toggleIds: Action<EditModeModel, string[]>;
  removeIds: Action<EditModeModel, string[]>;
  reset: Action<EditModeModel>;
}

export const editModeModel : EditModeModel = {
  viewMode: ViewMode.VIEW,
  selectedIdMap: {},

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
    console.log('Add', ids, state.selectedIdMap);
  }),
  removeIds: action((state, ids) => {
    const selectedIds = state.selectedIdMap;
    ids.forEach(id => delete selectedIds[id]);
    console.log('remove', ids, state.selectedIdMap);
  }),
  toggleIds: action((state, ids) => {
    ids.forEach(id => {
      const selectedIdMap = state.selectedIdMap;
      const exists = selectedIdMap[id];
      if (exists) {
        delete selectedIdMap[id];
      } else {
        selectedIdMap[id] = true;
      }
    })
  }),
  reset: action((state) => {
    state.selectedIdMap = {};
  })
};
