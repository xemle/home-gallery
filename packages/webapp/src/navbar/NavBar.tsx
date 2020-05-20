import * as React from "react";
import {useRef} from "react";
import {
  Link, useHistory
} from "react-router-dom";
import { useStoreActions, useStoreState } from '../store/hooks';
import { ViewMode } from "../store/edit-mode-model";


export const NavBar = (props) => {
  const input = useRef<HTMLInputElement>();
  const search = useStoreActions(actions => actions.search.search);
  const viewMode = useStoreState(state => state.editMode.viewMode);
  const setViewMode = useStoreActions(actions => actions.editMode.setViewMode);
  const history = useHistory();

  const searchButtonClickHandler = (e) => {
    search({type: 'query', value: input.current.value, revert: false});
    history.push('/');
  }

  const searchInputKeyUpHandler = (e) => {
    if (e.keyCode === 13) {
      searchButtonClickHandler(e);
    }
  }

  const allClickHandler = () => {
    history.push('/');
    search({type: 'none', value: false, revert: false});
  }

  const editClickHandler = () => {
    setViewMode(viewMode === ViewMode.VIEW ? ViewMode.EDIT : ViewMode.VIEW);
  }

  return (
    <>
      <div className="nav -top -space">
        { viewMode === ViewMode.VIEW &&
          <div>
            <a className="nav__link link" onClick={allClickHandler}><i className="fas fa-globe"></i> <span className="hide-sm">Show all</span></a>
            <Link className="nav__link link" to={`/years`}><i className="fas fa-clock"></i> <span className="hide-sm">Years</span></Link>
            <a className="nav__link link" onClick={editClickHandler}><i className="fas fa-pen"></i> <span className="hide-sm">Edit</span></a>
          </div>
        }
        { viewMode === ViewMode.EDIT &&
          <div>
            <a className="nav__link link" onClick={editClickHandler}><i className="fas fa-pen"></i> <span className="hide-sm">Edit</span></a>
          </div>
        }

        <div className="button-group -input">
          <input className="input" ref={input} onKeyUp={searchInputKeyUpHandler} placeholder="Search..."/>
          <button className="button -default" onClick={searchButtonClickHandler}><i className="fas fa-search"></i></button>
        </div>
      </div>
    </>
  )
}
