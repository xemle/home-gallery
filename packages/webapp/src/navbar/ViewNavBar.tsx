import * as React from "react";
import {
  Link, useNavigate
} from "react-router-dom";
import { useSearchStore } from "../store/search-store";
import { useEditModeStore, ViewMode } from "../store/edit-mode-store";

import { SearchNavBar } from './search/SearchNavBar';

export const ViewNavBar = ({disableEdit}) => {
  const search = useSearchStore(state => state.search);
  const viewMode = useEditModeStore(state => state.viewMode);
  const setViewMode = useEditModeStore(actions => actions.setViewMode);
  const navigate = useNavigate();


  const allClickHandler = () => {
    navigate('/');
    search({type: 'none'});
  }

  const editClickHandler = () => {
    if (disableEdit) {
      return
    }
    setViewMode(viewMode === ViewMode.VIEW ? ViewMode.EDIT : ViewMode.VIEW)
  }

  const videoClickHandler = () => {
    navigate(`/search/video`);
  }

  return (
    <>
      <SearchNavBar>
        <div className="nav_group">
          <a className="nav_item link" onClick={allClickHandler}><i className="fas fa-globe"></i> <span className="hide-sm">Show all</span></a>
          <Link className="nav_item link" to={`/years`}><i className="fas fa-clock"></i> <span className="hide-sm">Years</span></Link>
          <a className="nav_item link" onClick={videoClickHandler}><i className="fas fa-play"></i> <span className="hide-sm">Videos</span></a>
          <a className={`nav_item link ${disableEdit ? '-disabled' : ''}`} onClick={editClickHandler}><i className="fas fa-pen"></i> <span className="hide-sm">Edit</span></a>
          <Link className="nav_item link" to={`/tags`}><i className="fas fa-tags"></i> <span className="hide-sm">Tags</span></Link>
          <Link className="nav_item link" to={`/map`}><i className="fas fa-map"></i> <span className="hide-sm">Map</span></Link>
        </div>
      </SearchNavBar>
    </>
  )
}
