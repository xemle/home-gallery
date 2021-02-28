import { Action, action } from 'easy-peasy';

export enum SingleViewMode {
  VIEW,
  DETAIL
}

export interface IdMap {
  [key: string]: boolean;
}

export interface SingleViewModel {
  viewMode: SingleViewMode;

  setViewMode: Action<SingleViewModel, SingleViewMode>;
}

export const singleViewModel : SingleViewModel = {
  viewMode: SingleViewMode.VIEW,

  setViewMode: action((state, mode) => {
    state.viewMode = mode;
  }),
};
