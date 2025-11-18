import * as React from "react";
import {
  useNavigate
} from "react-router-dom";
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useSearchStore } from "../store/search-store";
import { useEditModeStore, ViewMode } from "../store/edit-mode-store";

import useListLocation from '../utils/useListLocation'
import { useAppConfig } from "../config/useAppConfig";
import { NavItem } from "./NavItem";

type TNavItem = {
  icon: any
  text: string
  action: () => void
  // if true the item is shown but not clickable
  disabled?: boolean
  // if true the item is not shown at all
  hidden?: boolean
}

export const ViewNavBar = ({disableEdit}) => {
  const search = useSearchStore(state => state.search);
  const viewMode = useEditModeStore(state => state.viewMode);
  const setViewMode = useEditModeStore(actions => actions.setViewMode);
  const navigate = useNavigate();
  const listLocation = useListLocation()
  const appConfig = useAppConfig()

  const items: TNavItem[] = [
    {
      icon: icons.faGlobe,
      text: 'Show All',
      action: () => {
        navigate('/')
        search({type: 'none'});
      },
    },
    {
      icon: icons.faClock,
      text: 'Years',
      action: () => navigate('/years'),
      hidden: appConfig.pages?.disabled?.includes('date'),
    },
    {
      icon: icons.faPlay,
      text: 'Videos',
      action: () => navigate('/search/type:video'),
      hidden: appConfig.pages?.disabled?.includes('video'),
    },
    {
      icon: icons.faPen,
      text: 'Edit',
      action: () => {
        if (disableEdit || appConfig.disabled?.includes('edit')) {
          return
        }
        setViewMode(viewMode === ViewMode.VIEW ? ViewMode.EDIT : ViewMode.VIEW)
      },
      disabled: disableEdit,
      hidden: appConfig.pages?.disabled?.includes('edit') || appConfig.disabled?.includes('edit'),
    },
    {
      icon: icons.faTags,
      text: 'Tags',
      action: () => navigate('/tags'),
      hidden: appConfig.pages?.disabled?.includes('tag'),
    },
    {
      icon: icons.faMap,
      text: 'Map',
      action: () => navigate('/map', {state: {listLocation}}),
      hidden: appConfig.pages?.disabled?.includes('map'),
    },
  ]
  
  return (
    <>
      {items.filter(item => !item.hidden).map((item, key) => (
        <NavItem key={key} onClick={item.action} icon={item.icon} text={item.text} disabled={item.disabled} />
      ))}
    </>
  )
}
