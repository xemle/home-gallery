import { Action, action } from 'easy-peasy';

export interface IdMap {
  [key: string]: boolean;
}

export interface SingleViewModel {
  showDetails: boolean;

  setShowDetails: Action<SingleViewModel, boolean>;
}

export const singleViewModel : SingleViewModel = {
  showDetails: false,

  setShowDetails: action((state, show) => {
    state.showDetails = show;
  }),
};
