import { Event, EventListener } from '@home-gallery/events'

export class ActionEventListener {
  eventListeners: EventListener[] = [];

  subscribe = (onEventHandler: EventListener) => {
    this.eventListeners.push(onEventHandler);

    return () => {
      const listener = this.eventListeners.find(listener => listener === onEventHandler);
      const index = this.eventListeners.indexOf(listener);
      this.eventListeners.splice(index, 1);
    }
  }

  publish = (event: Event) => {
    this.eventListeners.forEach(listener => listener(event));
  }
}
