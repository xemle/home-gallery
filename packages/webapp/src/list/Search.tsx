import * as React from "react";

import {
  useParams,
} from "react-router-dom";

import { List } from './List';
import { useStoreActions } from '../store/hooks';

export const SearchView = () => {
  const params = useParams();
  const term = params.term;
  const search = useStoreActions(actions => actions.search.search);
  search({type: 'query', value: term});

  return ( 
    <>
      <List />
    </>
  )
}
