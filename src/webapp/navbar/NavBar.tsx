import * as React from "react";
import {useRef} from "react";
import {
  Link, useHistory
} from "react-router-dom";
import { useStoreActions } from '../store/hooks';


export const NavBar = (props) => {
  const input = useRef<HTMLInputElement>();
  const search = useStoreActions(actions => actions.entries.search);
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

  return ( 
    <>
      <div className="nav -top -space">
        <div>
          <a className="nav__link link" onClick={allClickHandler}><i className="fas fa-globe"></i> <span className="hide-sm">Show all</span></a>
          <Link className="nav__link link" to={`/years`}><i className="fas fa-clock"></i> <span className="hide-sm">Years</span></Link>
        </div>

        <div className="button-group -input">
          <input className="input" ref={input} onKeyUp={searchInputKeyUpHandler} placeholder="Search..."/>
          <button className="button -default" onClick={searchButtonClickHandler}><i className="fas fa-search"></i></button>
        </div>
      </div>
    </>
  )
}
