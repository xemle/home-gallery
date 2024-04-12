import { useReducer } from "react"

import { FaceTag } from "../api/models"
import { FaceTagSuggestion, getSuggestions } from "./face-tag-suggestion"

export interface FaceTagDialogState {
  current: number
  faceTags: FaceTag[]
  allTags: string[]
  suggestions: FaceTagSuggestion[]
  showSuggestions: boolean
}

export const initialState: FaceTagDialogState = {
  current: 0,
  faceTags: [],
  allTags: [],
  suggestions: [],
  showSuggestions: false
}

export type FaceTagAction =
 | {type: 'addFaceTag', selectedId: number, value: string, tail?: string}
 | {type: 'setAllFaceTags', selectedIds: number[], value: string[]}
 | {type: 'suggestFaceTag', selectedId: number, value: string}
 | {type: 'removeLastFaceTag'}
 | {type: 'removeFaceTag', selectedId: number, value: string}
 | {type: 'toggleFaceTagRemoveFlag', selectedId: number, value: string}
 | {type: 'clearFaceTagSuggentions'}
 | {type: 'nextFaceTagSuggestion'}
 | {type: 'prevFaceTagSuggestion'}

const updateItem = <T,>(items : T[], findPredicate : (item: T, index: number, items: T[]) => boolean, updateValue : Partial<T> | ((item: T) => T)) : number => {
  const index = items.findIndex(findPredicate)
  if (index < 0) {
    return index
  }
  const update = typeof updateValue == 'function' ? updateValue({...items[index]}) : {...items[index], ...updateValue}
  items.splice(index, 1, update)
  return index
}

export const reducer = (state: FaceTagDialogState, action: FaceTagAction): FaceTagDialogState => {
  switch (action.type) {
    case 'addFaceTag': {
      let name = action.value.replace(/(^\s+|\s+$)/g, '')
      let remove = false
      let rect = state.faceTags[action.selectedId].rect;
      const tailSuggestions = {inputValue: action.tail || '', suggestions: getSuggestions(state.allTags, action.tail), showSuggestions: !!action.tail}

      const faceTags: FaceTag[] = [...state.faceTags, {rect, name, remove}];
      return {...state, faceTags, ...tailSuggestions}
    }
/*

    case 'setAllTags': {
      const allTags = action.value
      const selectedIds = action.selectedIds
      return {...state, allTags, suggestions: getSuggestions(allTags, selectedIds)}
    }
    case 'suggestTag': {
      const suggestions = getSuggestions(state.allTags, action.value)
      const hasActiveSuggestion = state.suggestions.find(suggestion => suggestion.active)
      const becomesEmpty = state.inputValue.replace(/(^\s*-?|\s+$)/g, '').length && !(action.value || '').replace(/(^\s*-?|\s+$)/g, '').length
      return {...state, inputValue: action.value, suggestions, showSuggestions: !!hasActiveSuggestion || !becomesEmpty}
    }
    case 'removeLastTag': {
      const tags: FaceTag[] = [...state.faceTags]
      return {...state, faceTags: state.faceTags.slice(0, state.faceTags.length - 1), current: 0, suggestions: getSuggestions(state.allTags, '')}
    }
    case 'removeTag': {
      const index = state.faceTags.findIndex(tag => tag.name == action.value)
      if (index < 0) {
        return state
      }
      const faceTags = [...state.faceTags]
      faceTags.splice(index, 1)
      return {...state, faceTags}
    }
    case 'toggleRemoveFlag': {
      const faceTags = [...state.faceTags]
      const index = updateItem(faceTags, item => item.name == action.value, item => {item.remove = !item.remove; return item})
      if (index < 0) {
        return state
      }

      return {...state, faceTags}
    }
    case 'clearSuggentions': {
      const suggestions = [...state.suggestions]
      updateItem(suggestions, item => item.active, {active: false})
      return {...state, suggestions, showSuggestions: false}
    }
    case 'nextSuggestion':
    case 'prevSuggestion': {
      const suggestions = [...state.suggestions]
      if (!suggestions.length) {
        return state
      }
      let index = updateItem(suggestions, item => item.active, {active: false})
      if (index < 0) {
        index = action.type == 'nextSuggestion' ? -1 : suggestions.length
      }
      const offset = action.type == 'nextSuggestion' ? 1 : -1
      index = (suggestions.length + index + offset) % suggestions.length
      updateItem(suggestions, (_, i) => i == index, {active: true})
      return {...state, suggestions, showSuggestions: true}
    } */
  }

  return state
}

export const useFaceTagsDialogStore = (partial : Partial<FaceTagDialogState> = {}) => useReducer(reducer, {...initialState, ...partial})