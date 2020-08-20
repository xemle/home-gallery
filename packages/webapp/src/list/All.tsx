import * as React from "react";

import { List } from './List';
import { useStoreActions } from '../store/hooks';

export const AllView = () => {
  const search = useStoreActions(actions => actions.search.search);
  search({type: 'none'});

  return ( 
    <>
      <List />
    </>
  )
}
