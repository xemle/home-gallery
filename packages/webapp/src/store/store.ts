import { createStore } from 'easy-peasy';
import { entryModel, EntryModel } from './entry-model';
import { searchModel, SearchModel } from './search-model';
import { eventModel, EventModel } from './event-model';
import { editModeModel, EditModeModel } from './edit-mode-model';

export interface StoreModel {
  entries: EntryModel;
  search: SearchModel;
  events: EventModel;
  editMode: EditModeModel;
}

export const store = createStore<StoreModel>({
  entries: entryModel,
  search: searchModel,
  events: eventModel,
  editMode: editModeModel
});
