
import { v4 as uuidv4 } from 'uuid';
import { Event, EventAction, EventListener } from '@home-gallery/events'
import { pushEvent as pushEventApi, eventStream as eventStreamApi, ServerEventListener } from './api';
import { ActionEventListener } from './ActionEventListner';
import { UnsavedEventHandler } from './UnsavedEventHanlder';
export { fetchAll, getEvents } from './api'

const tagToAction = (tag: string): EventAction => {
  if (tag.substr(0, 1) === '-') {
    return {action: 'removeTag', value: tag.substring(1)}
  } else {
    return {action: 'addTag', value: tag}
  }
}

export const addTags = async (entryIds: string[], tagInput: string) => {
  const actions = tagInput
      .replace(/(^\s+|\s+$)/g, '')
      .split(/\s*,\s*/)
      .map(tagToAction);
  const event: Event = {id: uuidv4(), type: 'userAction', targetIds: entryIds, actions };
  return pushEvent(event);
}

let eventStreamSubscribed = false;

const unsavedEventHandler = new UnsavedEventHandler();
const actionEventListener = new ActionEventListener();

export const pushEvent = async (event: Event) => {
  actionEventListener.publish(event);
  unsavedEventHandler.addEvent(event);
  return pushEventApi(event)
    .catch(e => {
      console.log(`Event ${event.id} could not be sent: ${e}. Event will be lost on the next session`);
      throw e;
    });
}

export const eventStream = (onActionEvent: EventListener, onServerEvent: ServerEventListener) => {
  if (!eventStreamSubscribed) {
    eventStreamSubscribed = true;
    eventStreamApi(unsavedEventHandler.middleware(actionEventListener.publish), onServerEvent);
  }
  return actionEventListener.subscribe(onActionEvent);
}