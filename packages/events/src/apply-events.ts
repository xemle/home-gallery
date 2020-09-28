import { Event, EventAction } from './models';

export interface Taggable {
  tags?: string[];
  appliedEventIds?: string[];
}

const applyEventAction = <T extends Taggable>(data: T, action: EventAction): boolean => {
  let changed = false;
  switch (action.action) {
    case 'addTag': {
      if (!data.tags) {
        data.tags = [];
      }
      if (data.tags.indexOf(action.value) < 0) {
        data.tags.push(action.value);
        changed = true;
      }
      break;
    }
    case 'removeTag': {
      if (!data.tags || !data.tags.length) {
        return false;
      }
      const index = data.tags.indexOf(action.value);
      if (index >= 0) {
        data.tags.splice(index, 1);
        changed = true;
      }
      break;
    }
  }
  return changed;
}

const isValidEvent = (event: Event) => {
  return event.type == 'userAction' && event.targetIds?.length && event.actions?.length  
}

export const applyEvents = (entries: Map<String, Taggable>, events: Event[]): Taggable[] => {
  const changedEntries: Taggable[] = [];
  events.filter(isValidEvent).forEach(event => {
    const eventId = event.id;
    const targetEntries: Taggable[] = event.targetIds
      .filter(entryId => entries.has(entryId))
      .map(entryId => <Taggable>entries.get(entryId))
      .filter((entry: Taggable) => !entry.appliedEventIds || entry.appliedEventIds.indexOf(eventId) < 0);

    targetEntries.forEach(entry => {
      let changed = false;
      event.actions.forEach(action => {
        changed = applyEventAction(entry, action) || changed;
      });

      if (!entry.appliedEventIds) {
        entry.appliedEventIds = [];
      }
      entry.appliedEventIds.push(event.id);
      if (changed) {
        changedEntries.push(entry);
      }
    })
  })
  return changedEntries;
}
