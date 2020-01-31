import * as React from "react";
import {useRef} from "react";
import {
  Link
} from "react-router-dom";
import { useStoreActions } from '../store/hooks';


export const NavBar = (props) => {
  const input = useRef<HTMLInputElement>();
  const search = useStoreActions(actions => actions.entries.search);

  const searchButtonClickHandler = (e) => {
    search(input.current.value);
  }

  const searchInputKeyUpHandler = (e) => {
    if (e.keyCode === 13) {
      search(input.current.value);
    }
  }

  return ( 
    <>
      <div className="nav">
        NavBar

        <Link className="nav__link" to={`/`}>All</Link>
        <Link className="nav__link" to={`/years`}>Years</Link>

        <div className="nav__search">
          <input ref={input} onKeyUp={searchInputKeyUpHandler} placeholder="Search..."/>
          <button onClick={searchButtonClickHandler}>OK</button>
        </div>
      </div>
    </>
  )
}
