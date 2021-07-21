import { Action, action } from 'easy-peasy';

export interface IdMap {
  [key: string]: boolean;
}

export interface SingleViewModel {
  showDetails: boolean;
  showNavigation: boolean;

  setShowDetails: Action<SingleViewModel, boolean>;
  setShowNavigation: Action<SingleViewModel, boolean>;
}

export const singleViewModel : SingleViewModel = {
  showDetails: false,
  showNavigation: true,

  setShowDetails: action((state, show) => {
    state.showDetails = show;
  }),
  setShowNavigation: action((state, show) => {
    state.showNavigation = show;
  }),
};
