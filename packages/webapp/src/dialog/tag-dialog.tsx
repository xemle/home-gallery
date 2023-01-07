import * as React from "react";
import { useState, useReducer, useEffect } from "react";

import { useEventStore } from '../store/event-store'
import { useEntryStore } from '../store/entry-store'
import { TagInput } from "./tag-input";
import { Tag } from "../api/models";
import { RecentTags } from "./recent-tags";
import { MultiTagHelp, SingleTagHelp } from "./tag-dialog-help";
import { useDialogStore } from "./tag-dialog-store";

export interface TagDialogFormData {
  tags: Tag[];
}

export interface TagDialogProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: TagDialogFormData) => void;
}

export interface SingleTagDialogProps extends TagDialogProps {
  tags: Tag[];
}

const useAllTags = () => {
  const [allTags, setAllTags] = useState<string[]>([])
  const allEntries = useEntryStore(state => state.allEntries);

  useEffect(() => {
    const newAllTags = allEntries.reduce((result, entry) => {
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
    setAllTags(newAllTags)
  }, [allEntries])

  return allTags
}

const Dialog = ({visible, title, onCancel, onSubmit, children}) => {
  return (
    <div className={`modal ${visible ? '-visible' : ''}`}>
      <div className="modal__backdrop"></div>
      <div className="modal__overlay">
        <div className="dialog text">
          <div className="dialog__header">
            <h3>{title}</h3>
            <button className="button -closeable" onClick={onCancel}><i className="fas fa-times"></i></button>
          </div>
          <form autoComplete="off" onSubmit={onSubmit}>
            <div className="dialog__scroll-container">
              <div className="dialog__content">
                {children}
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

export const MultiTagDialog = ({onCancel, onSubmit, visible}: TagDialogProps) => {
  const [state, dispatch] = useDialogStore();
  const [showHelp, setShowHelp] = useState(false)

  const recentTags = useEventStore(state => state.recentTags);
  const allTags = useAllTags()

  useEffect(() => {
    dispatch({type: 'setAllTags', value: allTags})
  }, [allTags])

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
    <Dialog visible={visible} title='Edit Tags' onSubmit={submitHandler} onCancel={onCancel} >
      <div className="field">
        <label htmlFor="tags">Add Tags <a className="fas fa-question-circle" onClick={() => setShowHelp(show => !show)} title="Show help for tag input"></a></label>
        <MultiTagHelp show={showHelp} setShow={setShowHelp} />
        <TagInput tags={state.tags} withRemove={true} suggestions={state.suggestions} showSuggestions={state.showSuggestions} dispatch={dispatch} value={state.inputValue} />
        <RecentTags tags={recentTags} dispatch={dispatch} />
      </div>
    </Dialog>
  )
}

export const SingleTagDialog = ({tags, onCancel, onSubmit, visible}: SingleTagDialogProps) => {
  const [state, dispatch] = useDialogStore({tags})
  const [showHelp, setShowHelp] = useState(false)

  const recentTags = useEventStore(state => state.recentTags);
  const allTags = useAllTags()

  useEffect(() => {
    dispatch({type: 'setAllTags', value: allTags})
  }, [allTags])

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
    <Dialog visible={visible} title='Edit Media Tags' onSubmit={submitHandler} onCancel={onCancel} >
      <div className="field">
        <label htmlFor="tags">Add Tags <a className="fas fa-question-circle" onClick={() => setShowHelp(show => !show)} title="Show help for tag input"></a></label>
        <SingleTagHelp show={showHelp} setShow={setShowHelp} />
        <TagInput tags={state.tags} withRemove={false} suggestions={state.suggestions} showSuggestions={state.showSuggestions} dispatch={dispatch} value={state.inputValue} />
        <RecentTags tags={recentTags} dispatch={dispatch} />
      </div>
    </Dialog>
  )
}
