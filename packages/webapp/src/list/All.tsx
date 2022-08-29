import * as React from "react";
import { useEffect } from "react";

import { List } from './List';
import { useSearchStore } from '../store/search-store'

export const AllView = () => {
  const search = useSearchStore(state => state.search);

  useEffect(() => {
    search({type: 'none'});
  }, [])

  return ( 
    <>
      <List />
    </>
  )
}
