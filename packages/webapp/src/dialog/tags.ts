import { Tag } from "../api/models";

export interface TagSuggestion extends Tag {
  active: boolean;
}