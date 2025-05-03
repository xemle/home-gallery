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
      icon: icons.faCalendarDays,
      text: 'Years',
      action: () => navigate('/years'),
      disabled: false,
    },
    {
      icon: icons.faVideo,
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

  return (
    <>
      {items.map((item, key) => (
        <NavItem key={key} onClick={item.action} icon={item.icon} text={item.text} disabled={item.disabled} />
      ))}
    </>
  )
}
