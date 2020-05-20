import { Action, action } from 'easy-peasy';

export enum ViewMode {
  VIEW,
  EDIT
}

export interface EditModeModel {
  viewMode: ViewMode;

  setViewMode: Action<EditModeModel, ViewMode>;
}

export const editModeModel : EditModeModel = {
  viewMode: ViewMode.VIEW,

  setViewMode: action((state, payload) => {
    state.viewMode = payload;
  })
};
