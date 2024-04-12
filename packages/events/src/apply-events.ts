import { random } from 'lodash';
import { Event, EventAction, FaceTag, Rect } from './models';

import { Taggable } from './taggable';

const defaultRect: Rect = {
  x: -1,
  y: -1,
  width: -1,
  height: -1
}

const findFace = (faces: any[], rect: Rect) => {
  return faces.findIndex((face) =>
    face.x == rect.x
    && face.y == rect.y
    && face.width == rect.width
    && face.height == rect.height
  )
}

const applyEventAction = <T extends Taggable>(data: T, action: EventAction): boolean => {
  let changed = false;
  switch (action.action) {
    case 'addTag': {
      if (!data.tags) {
        data.tags = [];
      }
      if (data.tags.indexOf(action.value as string) < 0) {
        data.tags.push(action.value as string);
        changed = true;
      }
      break;
    }
    case 'removeTag': {
      if (!data.tags || !data.tags.length) {
        return false;
      }
      const index = data.tags.indexOf(action.value as string);
      if (index >= 0) {
        data.tags.splice(index, 1);
        changed = true;
      }
      break;
    }

    case 'addFaceTag': {
      if (!data.faces || !data.faces.length) {
        return false;
      }

      const faceIdx = findFace(data.faces, (action.value as FaceTag).rect)
      if (faceIdx >= 0) {
        data.faces[faceIdx].faceTag = (action.value as FaceTag).name;
        changed = true;
      }
      break;
    }
    case 'removeFaceTag': {
      if (!data.faces || !data.faces.length) {
        return false;
      }
      const faceIdx = findFace(data.faces, (action.value as FaceTag).rect)
      if (faceIdx >= 0) {
        data.faces[faceIdx].faceTag = `unknown (${random(0, 1000)})`;
        changed = true;
      }
      break;
    }
  }
  return changed;
}

const isValidEvent = (event: Event) => {
  return event.type == 'userAction'
    && event.targetIds?.length
    && event.actions?.length
}

const applyEventDate = (entry: Taggable, event: Event) => {
  if (!event.date) {
    return
  } else if (!entry.updated || entry.updated < event.date) {
    entry.updated = event.date
  }
}

type EntryIdMap = { [key: string]: Taggable[] }

const idMapReducer = (result: EntryIdMap, entry: Taggable) => {
  const id = entry.id
  if (!result[id]) {
    result[entry.id] = [entry]
  } else {
    result[id].push(entry)
  }

  return result
}

const flattenReducer = (result: Taggable[], entry: Taggable[]) => {
  result.push(...entry)
  return result
}

export const applyEvents = (entries: Taggable[], events: Event[]): Taggable[] => {
  // on server side duplicated entries ids may exists
  const id2Entries: EntryIdMap = entries.reduce(idMapReducer, {} as EntryIdMap)

  const changedEntries: Taggable[] = [];
  events.filter(isValidEvent).forEach(event => {
    const eventId = event.id;
    const targetEntries: Taggable[] = event.targetIds
      .filter(entryId => id2Entries[entryId]?.length)
      .map(entryId => id2Entries[entryId])
      .reduce(flattenReducer, [] as Taggable[])
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
        if (!changedEntries.includes(entry)) {
          changedEntries.push(entry);
        }
        applyEventDate(entry, event);
      }
    })
  })
  return changedEntries;
}
