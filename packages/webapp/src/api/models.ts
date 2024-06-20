import { Rect } from '@home-gallery/events'

export interface Tag {
  name: string;
  remove: boolean;
}

export interface FaceTag extends Tag {
  rect: Rect;
}