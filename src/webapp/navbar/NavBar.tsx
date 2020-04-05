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
      <div className="nav">
        Gallery

        <a className="nav__link" onClick={allClickHandler}>All</a>
        <Link className="nav__link" to={`/years`}>Years</Link>

        <div className="nav__search">
          <input ref={input} onKeyUp={searchInputKeyUpHandler} placeholder="Search..."/>
          <button onClick={searchButtonClickHandler}>OK</button>
        </div>
      </div>
    </>
  )
}
