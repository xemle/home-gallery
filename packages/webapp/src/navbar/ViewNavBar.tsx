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
      hidden: appConfig.disabledSearchAllPage,
    },
    {
      icon: icons.faClock,
      text: 'Years',
      action: () => navigate('/years'),
      hidden: appConfig.disabledYearsPage,
    },
    {
      icon: icons.faPlay,
      text: 'Videos',
      action: () => navigate('/search/type:video'),
      hidden: appConfig.disabledVideosPage,
    },
    {
      icon: icons.faPen,
      text: 'Edit',
      action: () => {
        if (disableEdit || appConfig.disabledEdit) {
          return
        }
        setViewMode(viewMode === ViewMode.VIEW ? ViewMode.EDIT : ViewMode.VIEW)
      },
      disabled: disableEdit || appConfig.disabledEdit,
      hidden: appConfig.disabledEditPage,
    },
    {
      icon: icons.faTags,
      text: 'Tags',
      action: () => navigate('/tags'),
      hidden: appConfig.disabledTagsPage,
    },
    {
      icon: icons.faMap,
      text: 'Map',
      action: () => navigate('/map', {state: {listLocation}}),
      hidden: appConfig.disabledMapPage,
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
