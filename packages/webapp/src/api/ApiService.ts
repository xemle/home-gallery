
import { v4 as uuidv4 } from 'uuid';
import type { Event, EventAction } from '@home-gallery/events'
import { pushEvent as pushEventApi } from './api';
import { UnsavedEventHandler } from './UnsavedEventHandler';
import { type Tag } from './models';
import { EventBus } from './EventBus';
import { EventStream } from './EventStream';

export { fetchAll, getEvents, mapEntriesForBrowser } from './api'

const tagToAction = (tag: Tag): EventAction => {
  if (tag.remove) {
    return {action: 'removeTag', value: tag.name}
  } else {
    return {action: 'addTag', value: tag.name}
  }
}

export const addTags = async (entryIds: string[], tags: Tag[]) => {
  const actions = tags.map(tagToAction);
  const event: Event = {type: 'userAction', id: uuidv4(), targetIds: entryIds, actions };
  return pushEvent(event);
}

const unsavedEventHandler = new UnsavedEventHandler();
export const eventBus = new EventBus()

export const pushEvent = async (event: Event) => {
  unsavedEventHandler.addEvent(event)
  eventBus.dispatch(event)
  return pushEventApi(event)
    .catch(e => {
      console.log(`Event ${event.id} could not be sent: ${e}. Event will be lost on the next session`);
      throw e;
    });
}

export const createEventStream = (onEvent: (event: Event) => void) => {
  const eventStream = new EventStream(event => {
    unsavedEventHandler.middleware(onEvent)(event)
  });
  return eventStream
}

