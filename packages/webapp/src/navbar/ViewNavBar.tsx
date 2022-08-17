import * as React from "react";
import {
  Link, useHistory
} from "react-router-dom";
import { useStoreActions, useStoreState } from '../store/hooks';

import { ViewMode } from "../store/edit-mode-model";
import { SearchNavBar } from './search/SearchNavBar';

export const ViewNavBar = () => {
  const search = useStoreActions(actions => actions.search.search);
  const viewMode = useStoreState(state => state.editMode.viewMode);
  const setViewMode = useStoreActions(actions => actions.editMode.setViewMode);
  const history = useHistory();


  const allClickHandler = () => {
    history.push('/');
    search({type: 'none'});
  }

  const editClickHandler = () => {
    setViewMode(viewMode === ViewMode.VIEW ? ViewMode.EDIT : ViewMode.VIEW);
  }

  const videoClickHandler = () => {
    history.push(`/search/video`);
  }

  return (
    <>
      <SearchNavBar >
        <div>
          <a className="nav__link link" onClick={allClickHandler}><i className="fas fa-globe"></i> <span className="hide-sm">Show all</span></a>
          <Link className="nav__link link" to={`/years`}><i className="fas fa-clock"></i> <span className="hide-sm">Years</span></Link>
          <a className="nav__link link" onClick={videoClickHandler}><i className="fas fa-play"></i> <span className="hide-sm">Videos</span></a>
          <a className="nav__link link" onClick={editClickHandler}><i className="fas fa-pen"></i> <span className="hide-sm">Edit</span></a>
          <Link className="nav__link link" to={`/tags`}><i className="fas fa-tags"></i> <span className="hide-sm">Tags</span></Link>
          <Link className="nav__link link" to={`/map`}><i className="fas fa-map"></i> <span className="hide-sm">Map</span></Link>
        </div>
      </SearchNavBar>
    </>
  )
}
