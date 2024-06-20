export interface Event {
  type: 'userAction';
  id: string;
  date?: string;
  targetIds: string[];
  actions: EventAction[];
}

export interface EventAction {
  action: string;
  value: string|FaceTag;
}

export interface FaceTag {
  name: string;
  rect: Rect;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type EventListener = (event: Event) => void;
