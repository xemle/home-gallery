import * as React from "react";
import { useState, useMemo } from 'react';
import { useEditModeStore, ViewMode } from "../store/edit-mode-store";
import { useEntryStore } from "../store/entry-store";

import { SearchNavBar } from './search/SearchNavBar';
import { TagDialog } from '../dialog/tag-dialog';
import { addTags } from '../api/ApiService';

export const EditNavBar = () => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const viewMode = useEditModeStore(state => state.viewMode)

  const selectedEntries = useEditModeStore(state => state.selectedEntries);
  const selectedIds = useEditModeStore(state => state.selectedIds);
  const count = useEditModeStore(state => state.count);

  const setViewMode = useEditModeStore(state => state.setViewMode)
  const reset = useEditModeStore(state => state.reset);
  const selectAll = useEditModeStore(state => state.selectAll);
  const invert = useEditModeStore(state => state.invert);
  const setEntries = useEntryStore(state => state.setEntries);

  const toggleViewMode = () => {
    setViewMode(viewMode === ViewMode.VIEW ? ViewMode.EDIT : ViewMode.VIEW)
  }

  const onSubmit = ({tags}) => {
    const entries = selectedEntries()
    const entryIds = entries.map(entry => entry.id)
    addTags(entryIds, tags).then(() => {
      setDialogVisible(false);
    })

    return false;
  }

  const showSelected = () => {
    const entries = selectedEntries()
    setEntries(entries);
  }

  const selecedCount = useMemo(count, [selectedIds])
  return (
    <>
      <SearchNavBar>
        <div>
          <a className="nav__link link" onClick={toggleViewMode}><i className="fas fa-arrow-left"></i> <span className="hide-sm">Back</span></a>
          <a className="nav__link link" onClick={reset}><i className="fas fa-undo"></i> <span className="hide-sm">Reset all</span></a>
          <a className="nav__link link" onClick={selectAll}><i className="fas fa-folder"></i> <span className="hide-sm">All</span></a>
          <a className="nav__link link" onClick={invert}><i className="fas fa-exchange-alt"></i> <span className="hide-sm">Invert</span></a>
          <a className="nav__link link" onClick={showSelected}><i className="fas fa-eye"></i> <span className="hide-sm">View selected</span></a>
          <a className="nav__link link" onClick={() => setDialogVisible(true)}><i className="fas fa-check"></i> <span className="hide-sm">{`Edit ${selecedCount} media`}</span><span className="hide-md">{selecedCount}</span></a>
        </div>
      </SearchNavBar>
      { dialogVisible && 
        <TagDialog visible={dialogVisible} onCancel={() => setDialogVisible(false)} onSubmit={onSubmit} />
      }
    </>
  )
}
