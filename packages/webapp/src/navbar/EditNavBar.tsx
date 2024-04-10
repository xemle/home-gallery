import * as React from "react";
import { useState, useMemo } from 'react';
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useEditModeStore, ViewMode } from "../store/edit-mode-store";

import { NavItem } from "./NavItem";

export const EditNavBar = ({showDialog}) => {
  const viewMode = useEditModeStore(state => state.viewMode)

  const showSelected = useEditModeStore(state => state.showSelected);
  const toggleShowSelected = useEditModeStore(state => state.toggleShowSelected);
  const selectedIds = useEditModeStore(state => state.selectedIds);
  const count = useEditModeStore(state => state.count);

  const setViewMode = useEditModeStore(state => state.setViewMode)
  const reset = useEditModeStore(state => state.reset);
  const selectAll = useEditModeStore(state => state.selectAll);
  const invert = useEditModeStore(state => state.invert);

  const toggleViewMode = () => {
    setViewMode(viewMode === ViewMode.VIEW ? ViewMode.EDIT : ViewMode.VIEW)
  }

  const selecedCount = useMemo(count, [selectedIds])

  const items = [
    {
      icon: icons.faArrowLeft,
      text: 'Back',
      action: toggleViewMode
    },
    {
      icon: icons.faUndo,
      text: 'Reset all',
      action: reset
    },
    {
      icon: icons.faListCheck,
      text: 'All',
      action: selectAll
    },
    {
      icon: icons.faExchangeAlt,
      text: 'invert',
      action: invert
    },
    {
      icon: icons.faEye,
      text: 'View selected',
      action: toggleShowSelected
    },
    {
      icon: icons.faFileEdit,
      text: `Edit ${selecedCount} media`,
      smText: `${selecedCount}`,
      action: showDialog
    },
  ]

  return (
    <>
      {items.map((item, key) => (
        <NavItem key={key} onClick={item.action} icon={item.icon} text={item.text} smText={item.smText} />
      ))}
    </>
  )
}
