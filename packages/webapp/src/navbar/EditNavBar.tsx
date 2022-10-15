import * as React from "react";
import { useState } from 'react';
import { useStoreActions, useStoreState } from '../store/hooks';

import { ViewMode } from "../store/edit-mode-model";
import { SearchNavBar } from './search/SearchNavBar';
import { TagDialog } from '../dialog/tag-dialog';
import { addTags } from '../api/ApiService';

export const EditNavBar = () => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const viewMode = useStoreState(state => state.editMode.viewMode);

  const selectedIdMap = useStoreState(state => state.editMode.selectedIdMap);
  const id2Entries = useStoreState(state => state.entries.id2Entries)

  const setViewMode = useStoreActions(actions => actions.editMode.setViewMode);
  const reset = useStoreActions(actions => actions.editMode.reset);
  const selectAll = useStoreActions(actions => actions.editMode.selectAll);
  const invert = useStoreActions(actions => actions.editMode.invert);
  const setEntries = useStoreActions(actions => actions.entries.setEntries);

  const toggleViewMode = () => {
    setViewMode(viewMode === ViewMode.VIEW ? ViewMode.EDIT : ViewMode.VIEW);
  }

  const onSubmit = ({tags}) => {
    const entryIds = Object.keys(selectedIdMap);
    addTags(entryIds, tags).then(() => {
      setDialogVisible(false);
    })

    return false;
  }

  const showSelected = () => {
    const toShortId = id => id.substring(0, 12);
    const entryIds = Object.keys(selectedIdMap).map(toShortId);
    const entries = entryIds.map(id => id2Entries.get(id)).filter(e => !!e);
    setEntries(entries);
  }

  return (
    <>
      <SearchNavBar>
        <div>
          <a className="nav__link link" onClick={toggleViewMode}><i className="fas fa-arrow-left"></i> <span className="hide-sm">Back</span></a>
          <a className="nav__link link" onClick={() => reset()}><i className="fas fa-undo"></i> <span className="hide-sm">Reset all</span></a>
          <a className="nav__link link" onClick={() => selectAll()}><i className="fas fa-folder"></i> <span className="hide-sm">All</span></a>
          <a className="nav__link link" onClick={() => invert()}><i className="fas fa-exchange-alt"></i> <span className="hide-sm">Invert</span></a>
          <a className="nav__link link" onClick={showSelected}><i className="fas fa-eye"></i> <span className="hide-sm">View selected</span></a>
          <a className="nav__link link" onClick={() => setDialogVisible(true)}><i className="fas fa-check"></i> <span className="hide-sm">{`Edit ${Object.keys(selectedIdMap).length} media`}</span><span className="hide-md">{Object.keys(selectedIdMap).length}</span></a>
        </div>
      </SearchNavBar>
      { dialogVisible && 
        <TagDialog visible={dialogVisible} onCancel={() => setDialogVisible(false)} onSubmit={onSubmit} />
      }
    </>
  )
}
