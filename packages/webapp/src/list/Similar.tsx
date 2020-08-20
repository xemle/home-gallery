import * as React from "react";

import {
  useParams,
} from "react-router-dom";

import { List } from './List';
import { useStoreState, useStoreActions } from '../store/hooks';

export const SimilarView = () => {
  const params = useParams();
  const id = params.id;
  const allEntries = useStoreState(store => store.entries.allEntries);
  const current = allEntries.get(id);
  const search = useStoreActions(actions => actions.search.search);
  search({type: 'similar', value: current.similarityHash});

  return ( 
    <>
      <List />
    </>
  )
}
