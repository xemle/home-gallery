import * as React from "react";
import {MediaGrid} from "./MediaGrid";
import { NavBar } from "./NavBar";

export const Grid = (props) => {

  return ( 
    <>
      <NavBar />
      <MediaGrid media={props.media}/>
    </>
  )
}