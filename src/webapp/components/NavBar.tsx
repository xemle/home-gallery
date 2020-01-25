import * as React from "react";
import {
  Link
} from "react-router-dom";

export const NavBar = (props) => {
  return ( 
    <>
      <div className="nav">
        NavBar

        <Link className="nav-link" to={`/`}>All</Link>
        <Link className="nav-link" to={`/images`}>Images</Link>
        <Link className="nav-link" to={`/videos`}>Videos</Link>
        <Link className="nav-link" to={`/years`}>Years</Link>
      </div>
    </>
  )
}