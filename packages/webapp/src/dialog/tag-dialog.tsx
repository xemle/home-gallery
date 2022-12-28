import * as React from "react";
import { useState, useReducer, useEffect } from "react";

import { useEventStore } from '../store/event-store'
import { useEntryStore } from '../store/entry-store'
import { TagSuggestion } from "./tags";
import { TagInput } from "./tag-input";
import { Tag } from "../api/models";

export interface TagDialogFormData {
  tags: Tag[];
}

export interface TagDialogProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: TagDialogFormData) => void;
}

const TagHelp = ({show, setShow}) => {
  return (
    <>
      {show &&
        <div className="notification -info">
          <button className="button -closeable" onClick={() => setShow(false)}><i className="fas fa-times"></i></button>
          <p>Add single tags with <i className="-high-text">Enter key</i> or <i className="-high-text">comma sign</i>. Prefix tag with <i className="-high-text">minus sign</i> to remove tag from the media. E.g. <i className="-high-text">newTag, -removeTag</i>. Click on the tag to toggle between <i className="-high-text">add</i> and <i className="-high-text">remove</i> action.</p>
        </div>
      }
    </>
  )
}
const Tags = ({tags, addTag}) => {
  return tags.map((tag, i) => (
    <span key={i} onClick={() => addTag(tag)} className="mr-4 tag -button" title={`Click to tag '${tag}'`}><span>{tag}</span></span>
  ))
}

const RecentTags = ({tags, dispatch}: {tags: string[], dispatch: Function}) => {
  const [recentTagCount, setRecentTagCount] = useState(15)

  if (!tags.length) {
    return (<></>)
  }

  return (
    <>
      <p>Recent tags:</p>
      <p style={{lineHeight: '1.7rem'}}><Tags tags={tags.slice(0, recentTagCount).sort()} addTag={tag => dispatch({type: 'addTag', value: tag})} />
        { recentTagCount < tags.length &&
          <a onClick={() => setRecentTagCount(count => 2 * count)}>show more...</a>
        }
      </p>
    </>
  )
}
interface TagDialogState {
  inputValue: string,
  tags: Tag[]
  suggestions: TagSuggestion[]
  allTags: string[]
}

const initialState: TagDialogState = {
  inputValue: '',
  tags: [],
  allTags: [],
  suggestions: []
}

type TagAction =
 | {type: 'addTag', value: string, tail?: string}
 | {type: 'setAllTags', value: string[]}
 | {type: 'suggestTag', value: string}
 | {type: 'removeLastTag'}
 | {type: 'removeTag', value: string}
 | {type: 'toggleRemoveFlag', value: string}
 | {type: 'clearSuggentions'}
 | {type: 'nextSuggestion'}
 | {type: 'prevSuggestion'}

const getSussgestions = (allTags, value) => {
  if (!allTags.length || !value) {
    return []
  }
  let name = value.replace(/(^\s+|\s+$)/g, '').toLowerCase()
  let remove = false
  if (name.startsWith('-')) {
    name = name.substring(1)
    remove = true
  }
  const active = false
  return name && allTags.filter(tag => tag.toLowerCase().indexOf(name) >= 0).map(name => ({name, remove, active})) || [];
}

const reducer = (state: TagDialogState, action: TagAction): TagDialogState => {
  switch (action.type) {
    case 'addTag': {
      let name = action.value.replace(/(^\s+|\s+$)/g, '')
      let remove = false
      if (name.startsWith('-')) {
        name = name.substring(1)
        remove = true
      }
      const tailSuggestions = {inputValue: action.tail || '', suggestions: getSussgestions(state.allTags, action.tail)}
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
      return {...state, allTags: action.value}
    }
    case 'suggestTag': {
      const suggestions = getSussgestions(state.allTags, action.value)
      return {...state, inputValue: action.value, suggestions}
    }
    case 'removeLastTag': {
      const tags: Tag[] = [...state.tags]
      return {...state, tags: state.tags.slice(0, state.tags.length - 1), inputValue: '', suggestions: []}
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
      const index = state.tags.findIndex(tag => tag.name == action.value)
      if (index < 0) {
        return state
      }
      const toggleTag = {...state.tags[index]}
      toggleTag.remove = !toggleTag.remove
      const tags = [...state.tags]
      tags.splice(index, 1, toggleTag)
      return {...state, tags}
    }
    case 'clearSuggentions': {
      return {...state, suggestions: []}
    }
    case 'nextSuggestion':
    case 'prevSuggestion': {
        const suggestions = [...state.suggestions]
      if (!suggestions.length) {
        return state
      }
      let index = suggestions.findIndex(suggestion => suggestion.active)
      if (index < 0) {
        index = action.type == 'nextSuggestion' ? -1 : suggestions.length
      } else {
        suggestions[index].active = false
      }
      const offset = action.type == 'nextSuggestion' ? 1 : -1
      index = (index + offset) % suggestions.length
      suggestions[index].active = true
      return {...state, suggestions}
    }
  }

  return state
}

export const TagDialog = ({onCancel, onSubmit, visible}: TagDialogProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showHelp, setShowHelp] = useState(false)

  const recentTags = useEventStore(state => state.recentTags);
  const allEntries = useEntryStore(state => state.allEntries);

  useEffect(() => {
    const allTags = allEntries.reduce((result, entry) => {
      if (!entry.tags?.length) {
        return result
      }
      entry.tags.forEach((tag: string) => {
        if (!result.includes(tag)) {
          result.push(tag)
        }
      })
      return result
    }, [] as string[]).sort()
    dispatch({type: 'setAllTags', value: allTags})
  }, [allEntries])

  const getFinalTags = () => {
    const tags = [...state.tags]
    if (state.inputValue.length) {
      tags.push({name: state.inputValue, remove: false})
    }
    return tags
  }

  const submitHandler = (event) => {
    event.preventDefault();
    onSubmit({ tags: getFinalTags() });
  }

  return (
    <div className={`modal ${visible ? '-visible' : ''}`}>
      <div className="modal__backdrop"></div>
      <div className="modal__overlay">
        <div className="dialog text">
          <div className="dialog__header">
            <h3>Edit Tags</h3>
            <button className="button -closeable" onClick={onCancel}><i className="fas fa-times"></i></button>
          </div>
          <form autoComplete="off" onSubmit={submitHandler}>
            <div className="dialog__scroll-container">
              <div className="dialog__content">
                <div className="field">
                  <label htmlFor="tags">Add Tags <a className="fas fa-question-circle" onClick={() => setShowHelp(show => !show)} title="Show help for tag input"></a></label>
                  <TagHelp show={showHelp} setShow={setShowHelp} />
                  <TagInput tags={state.tags} suggestions={state.suggestions} dispatch={dispatch} value={state.inputValue} />
                  <RecentTags tags={recentTags} dispatch={dispatch} />
                </div>
              </div>
            </div>
            <div className="dialog__footer -grey">
              <div className="button-group -right">
                <button className="button -primary">Submit</button>
                <a className="link button -link" onClick={onCancel}>Cancel</a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
