import * as React from "react";
import {
  useNavigate
} from "react-router-dom";
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useSearchStore } from "../store/search-store";
import { useEditModeStore, ViewMode } from "../store/edit-mode-store";

import useListLocation from '../utils/useListLocation'
import { useAppConfig } from "../utils/useAppConfig";
import { NavItem } from "./NavItem";

export const ViewNavBar = ({disableEdit}) => {
  const search = useSearchStore(state => state.search);
  const viewMode = useEditModeStore(state => state.viewMode);
  const setViewMode = useEditModeStore(actions => actions.setViewMode);
  const navigate = useNavigate();
  const listLocation = useListLocation()
  const appConfig = useAppConfig()
  const itemKeys = {
    'Show All': 'globe',
    'Years': 'years',
    'Videos': 'videos',
    'Edit': 'edit',
    'Tags': 'tags',
    'Map': 'map',
    'Folders': 'folders'
  }
  const items = [
    {
      icon: icons.faGlobe,
      text: 'Show All',
      action: () => {
        navigate('/')
        search({type: 'none'});
      },
      disabled: false,
    },
    {
      icon: icons.faClock,
      text: 'Years',
      action: () => navigate('/years'),
      disabled: false,
    },
    {
      icon: icons.faFolder,
      text: 'Folders',
      action: () => navigate('/folders'),
      disabled: false,
    },
    {
      icon: icons.faPlay,
      text: 'Videos',
      action: () => navigate('/search/type:video'),
      disabled: false,
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
    },
    {
      icon: icons.faTags,
      text: 'Tags',
      action: () => navigate('/tags'),
      disabled: false,
    },
    {
      icon: icons.faMap,
      text: 'Map',
      action: () => navigate('/map', {state: {listLocation}}),
      disabled: false,
    },
  ]
  const finalItems = items.map(item => {
    const key = itemKeys[item.text]
    const isRemoved = appConfig.removed?.includes(key)
    const isDisabled = appConfig.disabled?.includes(key)
    return isRemoved ? null : { ...item, disabled: !!isDisabled }
  }).filter(Boolean)
  
  return (
    <>
      {appConfig.titleMessage && (
        <span className="text-gray-300 mr-3 whitespace-nowrap">
          {appConfig.titleMessage}
        </span>
      )}
      {finalItems.map((item, key) => (
        <NavItem key={key} onClick={item.action} icon={item.icon} text={item.text} disabled={item.disabled} />
      ))}
    </>
  )
}
