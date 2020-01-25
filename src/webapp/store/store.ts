import { createStore } from 'easy-peasy';
import { entryModel, EntryModel } from './entry-model';

export interface StoreModel {
  entries: EntryModel;
}

export const storeModel: StoreModel = {
  entries: entryModel
}

export const store = createStore(storeModel);
