export interface Event {
  type: 'userAction';
  id: string;
  date?: string;
  targetIds: string[];
  actions: EventAction[];
}

export interface EventAction {
  action: string;
  value: string;
}

export type EventListener = (event: Event) => void;
