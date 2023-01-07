import { useReducer } from "react"

import { Tag } from "../api/models"
import { TagSuggestion, getSuggestions } from "./suggestion"

export interface TagDialogState {
  inputValue: string,
  tags: Tag[]
  allTags: string[]
  suggestions: TagSuggestion[]
  showSuggestions: boolean
}

export const initialState: TagDialogState = {
  inputValue: '',
  tags: [],
  allTags: [],
  suggestions: [],
  showSuggestions: false
}

export type TagAction =
 | {type: 'addTag', value: string, tail?: string}
 | {type: 'setAllTags', value: string[]}
 | {type: 'suggestTag', value: string}
 | {type: 'removeLastTag'}
 | {type: 'removeTag', value: string}
 | {type: 'toggleRemoveFlag', value: string}
 | {type: 'clearSuggentions'}
 | {type: 'nextSuggestion'}
 | {type: 'prevSuggestion'}

const updateItem = <T,>(items : T[], findPredicate : (item: T, index: number, items: T[]) => boolean, updateValue : Partial<T> | ((item: T) => T)) : number => {
  const index = items.findIndex(findPredicate)
  if (index < 0) {
    return index
  }
  const update = typeof updateValue == 'function' ? updateValue({...items[index]}) : {...items[index], ...updateValue}
  items.splice(index, 1, update)
  return index
}

export const reducer = (state: TagDialogState, action: TagAction): TagDialogState => {
  switch (action.type) {
    case 'addTag': {
      let name = action.value.replace(/(^\s+|\s+$)/g, '')
      let remove = false
      if (name.startsWith('-')) {
        name = name.substring(1)
        remove = true
      }
      const tailSuggestions = {inputValue: action.tail || '', suggestions: getSuggestions(state.allTags, action.tail), showSuggestions: !!action.tail}
      const index = state.tags.findIndex(tag => tag.name == name)
      if (index >= 0) {
        const toggleTag = {...state.tags[index]}
        if (toggleTag.remove == remove) {
          return {...state, ...tailSuggestions}
        }
        toggleTag.remove = remove
        const tags = [...state.tags]
        tags.splice(index, 1, toggleTag)
        return {...state, tags, ...tailSuggestions}
      }

      const tags: Tag[] = [...state.tags, {name, remove}];
      return {...state, tags, ...tailSuggestions}
    }
    case 'setAllTags': {
      const allTags = action.value
      return {...state, allTags, suggestions: getSuggestions(allTags, state.inputValue)}
    }
    case 'suggestTag': {
      const suggestions = getSuggestions(state.allTags, action.value)
      const hasActiveSuggestion = state.suggestions.find(suggestion => suggestion.active)
      const becomesEmpty = state.inputValue.replace(/(^\s*-?|\s+$)/g, '').length && !(action.value || '').replace(/(^\s*-?|\s+$)/g, '').length
      return {...state, inputValue: action.value, suggestions, showSuggestions: !!hasActiveSuggestion || !becomesEmpty}
    }
    case 'removeLastTag': {
      const tags: Tag[] = [...state.tags]
      return {...state, tags: state.tags.slice(0, state.tags.length - 1), inputValue: '', suggestions: getSuggestions(state.allTags, '')}
    }
    case 'removeTag': {
      const index = state.tags.findIndex(tag => tag.name == action.value)
      if (index < 0) {
        return state
      }
      const tags = [...state.tags]
      tags.splice(index, 1)
      return {...state, tags}
    }
    case 'toggleRemoveFlag': {
      const tags = [...state.tags]
      const index = updateItem(tags, item => item.name == action.value, item => {item.remove = !item.remove; return item})
      if (index < 0) {
        return state
      }

      return {...state, tags}
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
    }
  }

  return state
}

export const useDialogStore = (partial : Partial<TagDialogState> = {}) => useReducer(reducer, {...initialState, ...partial})