import * as React from "react";

import { useStoreState } from '../store/hooks';

import { FluentList } from "./FluentList";
import { NavBar } from "../navbar/NavBar";

export const List = () => {
  const entries = useStoreState(state => state.entries.entries);

  return (
    <>
      <NavBar />
      <div style={{paddingTop: 44}}>
        <FluentList entries={entries}/>
      </div>
    </>
  )
}