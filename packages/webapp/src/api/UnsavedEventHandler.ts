import type { Event, EventListener } from '@home-gallery/events'

export class UnsavedEventHandler {
  unsavedEvents: Event[] = [];

  addEvent(event: Event) {
    this.unsavedEvents.push(event);
  }

  middleware(onEvent: EventListener) {
    const that = this;
    return (event) => {
      const unsavedEvent = that.unsavedEvents.find(unsavedEvent => unsavedEvent.id == event.id);
      if (unsavedEvent) {
        const index = that.unsavedEvents.indexOf(unsavedEvent);
        that.unsavedEvents.splice(index, 1);
      } else {
        onEvent(event);
      }
    }
  }
}
