import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useEventStore } from '../store/event-store'
import { useEntryStore } from '../store/entry-store'
import { useEditModeStore } from '../store/edit-mode-store'
import { FaceTagInput } from "./face-tag-input";
import { FaceTag } from "../api/models";
import { RecentTags } from "./recent-tags";
import { UsedTags } from "./used-tags";
import { MultiTagHelp, SingleTagHelp } from "./face-tag-dialog-help";
import { useFaceTagsDialogStore } from "./face-tag-dialog-store";

export type FaceTagDialogProps = {
  faceTags?: FaceTag[]
  onCancel: () => void;
  onSubmit: ({faceTags}: {faceTags: FaceTag[]}) => void;
}

const useAllFaceTags = () => {
  const allEntries = useEntryStore(state => state.allEntries)
  const selectedIds = useEditModeStore(state => state.selectedIds)

  return useMemo(() => {
    const allTags = {}
    const selectedTags = {}
    allEntries.forEach(entry => {
      if (!entry.faces?.length) {
        return
      }
      const isSelected: boolean = !!selectedIds[entry.id]
      entry.faces.forEach((face, i) => {
        if (!allTags[face.faceTag]) {
          allTags[face.faceTag] = 1
        } else {
          allTags[face.faceTag]++
        }
        if (isSelected && !selectedTags[face.faceTag]) {
          selectedTags[face.faceTag] = 1
        } else if (isSelected) {
          selectedTags[face.facetag]++
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

export const MultiFaceTagDialog = ({onCancel, onSubmit}: FaceTagDialogProps) => {
  const [state, dispatch] = useFaceTagsDialogStore()
  const [showHelp, setShowHelp] = useState(false)

  const recentTags = useEventStore(state => state.recentFaceTags);
  const [allFaceTags] = useAllFaceTags()

  const faceTag = state.faceTags[state.current];

  useEffect(() => {
    dispatch({type: 'setAllFaceTags', value: allFaceTags.map(t => t.name).sort(), selectedIds:[]})
  }, [allFaceTags])
  

  const getFinalTags = () => {
    const tags = [...state.faceTags]
    if (faceTag.name.length) {
      tags.push({name: faceTag.name, remove: false, rect: faceTag.rect})
    }
    return tags
  }

  const submitHandler = (event) => {
    event.preventDefault();
    onSubmit({ faceTags: getFinalTags() });
  }

  return (
    <Dialog title='Edit face tags' submitText={'Save Tags'} onSubmit={submitHandler} onCancel={onCancel} >
      <div className="flex flex-col gap-2">
        <label htmlFor="tags" className="flex items-center content-center gap-1">
          <span className="text-gray-400">Add Tags</span>
          <a className="w-6 h-6 ml-1 hover:cursor-pointer" onClick={() => setShowHelp(show => !show)} title="Show help for face tag input"><FontAwesomeIcon icon={icons.faQuestionCircle} className="text-gray-500 hover:text-gray-300"/></a>
        </label>
        <MultiTagHelp show={showHelp} setShow={setShowHelp} />
        {state.faceTags.map((tag, i) =>(
          <div className="flex flex-row items-center justify-start w-full gap-2 px-2 py-1">
          <img height={100} width={100}></img>
          <FaceTagInput tag={tag} withRemove={false} suggestions={state.suggestions} showSuggestions={state.showSuggestions} dispatch={dispatch} value={""} />
          </div>
        ))}
        <RecentTags tags={recentTags} dispatch={dispatch} />
        <UsedTags title="Most used tags:" tags={allFaceTags} initialCount={5} dispatch={dispatch} />
      </div>
    </Dialog>
  )
}

export const SingleFaceTagDialog = ({faceTags, onCancel, onSubmit}: FaceTagDialogProps) => {
  const [state, dispatch] = useFaceTagsDialogStore({faceTags})
  const [showHelp, setShowHelp] = useState(false)

  const recentTags = useEventStore(state => state.recentFaceTags);
  const [allFaceTags] = useAllFaceTags()

  const faceTag = state.faceTags[state.current];

  useEffect(() => {
    dispatch({type: 'setAllFaceTags', value: allFaceTags.map(t => t.name).sort(), selectedIds:[]})
  }, [allFaceTags])
  

  const getFinalTags = () => {
    const tags = [...state.faceTags]
    if (faceTag.name.length) {
      tags.push({name: faceTag.name, remove: false, rect: faceTag.rect})
    }
    return tags
  }

  const submitHandler = (event) => {
    event.preventDefault();
    onSubmit({ faceTags: getFinalTags() });
  }

  return (
    <Dialog title='Edit face tags' submitText={'Save Tags'} onSubmit={submitHandler} onCancel={onCancel} >
      <div className="flex flex-col gap-2">
        <label htmlFor="tags" className="flex items-center content-center gap-1">
          <span className="text-gray-400">Add Tags</span>
          <a className="w-6 h-6 ml-1 hover:cursor-pointer" onClick={() => setShowHelp(show => !show)} title="Show help for face tag input"><FontAwesomeIcon icon={icons.faQuestionCircle} className="text-gray-500 hover:text-gray-300"/></a>
        </label>
        <SingleTagHelp show={showHelp} setShow={setShowHelp} />
        {state.faceTags.map((tag, i) =>(
          <div className="flex flex-row items-center justify-start w-full gap-2 px-2 py-1">
          <img height={100} width={100}></img>
          <FaceTagInput tag={tag} withRemove={false} suggestions={state.suggestions} showSuggestions={state.showSuggestions} dispatch={dispatch} value={""} />
          </div>
        ))}
        <RecentTags tags={recentTags} dispatch={dispatch} />
        <UsedTags title="Most used tags:" tags={allFaceTags} initialCount={5} dispatch={dispatch} />
      </div>
    </Dialog>
  )
}
