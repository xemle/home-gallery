import * as React from "react";
import {
  useNavigate
} from "react-router-dom";
import { useSearchStore } from "../store/search-store";
import { useEditModeStore, ViewMode } from "../store/edit-mode-store";

import { SearchNavBar } from './search/SearchNavBar';
import useListLocation from '../utils/useListLocation'
import { useAppConfig } from "../utils/useAppConfig";

export const ViewNavBar = ({disableEdit}) => {
  const search = useSearchStore(state => state.search);
  const viewMode = useEditModeStore(state => state.viewMode);
  const setViewMode = useEditModeStore(actions => actions.setViewMode);
  const navigate = useNavigate();
  const listLocation = useListLocation()
  const appConfig = useAppConfig()

  const dispatch = (action) => {
    switch (action.type) {
      case 'all': {
        navigate('/');
        search({type: 'none'});
        break;
      }
      case 'years': {
        navigate('/years');
        break;
      }
      case 'video': {
        navigate('/search/type:video');
        break;
      }
      case 'edit': {
        if (disableEdit) {
          return
        }
        setViewMode(viewMode === ViewMode.VIEW ? ViewMode.EDIT : ViewMode.VIEW)
        break;
      }
      case 'tags': {
        navigate('/tags');
        break;
      }
      case 'map': {
        navigate('/map', {state: {listLocation}});
        break;
      }
    }
  }

  return (
    <>
      <SearchNavBar>
        <div className="nav_group">
          <a className="nav_item link" onClick={() => dispatch({type: 'all'})}><i className="fas fa-globe"></i> <span className="hide-sm">Show all</span></a>
          <a className="nav_item link" onClick={() => dispatch({type: 'years'})}><i className="fas fa-clock"></i> <span className="hide-sm">Years</span></a>
          <a className="nav_item link" onClick={() => dispatch({type: 'video'})}><i className="fas fa-play"></i> <span className="hide-sm">Videos</span></a>
          {!appConfig.disabledEdit &&
            <a className={`nav_item link ${disableEdit ? '-disabled' : ''}`} onClick={() => dispatch({type: 'edit'})}><i className="fas fa-pen"></i> <span className="hide-sm">Edit</span></a>
          }
          <a className="nav_item link" onClick={() => dispatch({type: 'tags'})}><i className="fas fa-tags"></i> <span className="hide-sm">Tags</span></a>
          <a className="nav_item link" onClick={() => dispatch({type: 'map'})}><i className="fas fa-map"></i> <span className="hide-sm">Map</span></a>
        </div>
      </SearchNavBar>
    </>
  )
}
