import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useEventStore } from '../store/event-store'
import { useEntryStore } from '../store/entry-store'
import { useEditModeStore } from '../store/edit-mode-store'
import { TagInput } from "./tag-input";
import { Tag } from "../api/models";
import { RecentTags } from "./recent-tags";
import { UsedTags } from "./used-tags";
import { MultiTagHelp, SingleTagHelp } from "./tag-dialog-help";
import { useDialogStore } from "./tag-dialog-store";

export type TagDialogFormData = {
  tags: Tag[];
}

export type TagDialogProps = {
  tags?: Tag[]
  onCancel: () => void;
  onSubmit: (data: TagDialogFormData) => void;
}

const useAllTags = () => {
  const allEntries = useEntryStore(state => state.allEntries)
  const selectedIds = useEditModeStore(state => state.selectedIds)

  return useMemo(() => {
    const allTags = {}
    const selectedTags = {}
    allEntries.forEach(entry => {
      if (!entry.tags?.length) {
        return
      }
      const isSelected: boolean = !!selectedIds[entry.id]
      entry.tags.forEach((tag: string) => {
        if (!allTags[tag]) {
          allTags[tag] = 1
        } else {
          allTags[tag]++
        }
        if (isSelected && !selectedTags[tag]) {
          selectedTags[tag] = 1
        } else if (isSelected) {
          selectedTags[tag]++
        }
      })
    })

    const toTagCount = ([name, count]) => ({name, count})
    const byName = (a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
    return [
      Object.entries(allTags).map(toTagCount).sort(byName),
      Object.entries(selectedTags).map(toTagCount).sort(byName),
    ]
  }, [allEntries, selectedIds])
}

const Dialog = ({title, submitText, onCancel, onSubmit, children}) => {
  return (
    <div className={'fixed left-0 top-0 bottom-0 right-0 max-dvh z-30 outline-none flex justify-center items-center'}>
      <div className="fixed top-0 bottom-0 left-0 right-0 bg-gray-700/50" />
      <div className="fixed top-0 bottom-0 left-0 right-0 flex items-center justify-center p-2">
        <form autoComplete="off" onSubmit={onSubmit} className="overflow-hidden flex flex-col w-[40rem] max-w-full max-h-full bg-gray-800 border border-gray-950 rounded-md">
          <div className="flex items-center justify-between flex-shrink-0 p-4 align-middle">
            <h3 className="text-gray-300">{title}</h3>
            <button className="flex items-center justify-center w-8 h-8 rounded cursor-pointer hover:bg-gray-700 active:bg-gray-600" onClick={onCancel}><FontAwesomeIcon icon={icons.faXmark} className="text-gray-400"/></button>
          </div>
          <div className="p-4 pt-0 overflow-y-auto">
            {children}
          </div>
          <div className="flex flex-row-reverse flex-shrink-0 gap-4 px-4 py-2 bg-gray-700">
            <button className="px-4 py-2 border rounded bg-primary-400 border-primary-700 hover:bg-primary-500 hover:cursor-pointer">{submitText}</button>
            <a className="px-4 py-2 text-gray-300 bg-transparent rounded hover:bg-gray-500 hover:text-gray-200 hover:cursor-pointer" onClick={onCancel}>Cancel</a>
          </div>
        </form>
      </div>
    </div>
  )
}

export const MultiTagDialog = ({onCancel, onSubmit}: TagDialogProps) => {
  const [state, dispatch] = useDialogStore();
  const [showHelp, setShowHelp] = useState(false)

  const recentTags = useEventStore(state => state.recentTags);
  const selectedIds = useEditModeStore(state => state.selectedIds)

  const [allTags, selectedTags] = useAllTags()

  useEffect(() => {
    dispatch({type: 'setAllTags', value: allTags.map(tag => tag.name).sort()})
  }, [allTags])

  const selectedIdCount = useMemo(() => Object.entries(selectedIds).filter(([_, selected]) => selected).length, [selectedIds])

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
    <Dialog title={`Edit tags of ${selectedIdCount} selected media`} submitText={'Add Tags'} onSubmit={submitHandler} onCancel={onCancel} >
      <div className="flex flex-col gap-2">
        <label htmlFor="tags" className="flex items-center content-center gap-1">
          <span className="text-gray-400">Add Tags</span>
          <a className="w-6 h-6 ml-1 hover:cursor-pointer" onClick={() => setShowHelp(show => !show)} title="Show help for tag input"><FontAwesomeIcon icon={icons.faQuestionCircle} className="text-gray-500 hover:text-gray-300"/></a>
        </label>
        <MultiTagHelp show={showHelp} setShow={setShowHelp} />
        <TagInput tags={state.tags} withRemove={true} suggestions={state.suggestions} showSuggestions={state.showSuggestions} dispatch={dispatch} value={state.inputValue} />
        <RecentTags tags={recentTags} dispatch={dispatch} />
        <UsedTags title="Tags of selected media:" tags={selectedTags} initialCount={15} dispatch={dispatch} />
        <UsedTags title="Most used tags:" tags={allTags} initialCount={5} dispatch={dispatch} />
      </div>
    </Dialog>
  )
}

export const SingleTagDialog = ({tags, onCancel, onSubmit}: TagDialogProps) => {
  const [state, dispatch] = useDialogStore({tags})
  const [showHelp, setShowHelp] = useState(false)

  const recentTags = useEventStore(state => state.recentTags);
  const [allTags] = useAllTags()

  useEffect(() => {
    dispatch({type: 'setAllTags', value: allTags.map(tag => tag.name).sort()})
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
    <Dialog title='Edit media tags' submitText={'Save Tags'} onSubmit={submitHandler} onCancel={onCancel} >
      <div className="flex flex-col gap-2">
        <label htmlFor="tags" className="flex items-center content-center gap-1">
          <span className="text-gray-400">Add Tags</span>
          <a className="w-6 h-6 ml-1 hover:cursor-pointer" onClick={() => setShowHelp(show => !show)} title="Show help for tag input"><FontAwesomeIcon icon={icons.faQuestionCircle} className="text-gray-500 hover:text-gray-300"/></a>
        </label>
        <SingleTagHelp show={showHelp} setShow={setShowHelp} />
        <TagInput tags={state.tags} withRemove={false} suggestions={state.suggestions} showSuggestions={state.showSuggestions} dispatch={dispatch} value={state.inputValue} />
        <RecentTags tags={recentTags} dispatch={dispatch} />
        <UsedTags title="Most used tags:" tags={allTags} initialCount={5} dispatch={dispatch} />
      </div>
    </Dialog>
  )
}
