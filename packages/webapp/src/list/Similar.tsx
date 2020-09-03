import * as React from "react";

import {
  useParams,
  useLocation
} from "react-router-dom";

import { List } from './List';
import { useStoreState, useStoreActions } from '../store/hooks';

export const SimilarView = () => {
  const params = useParams();
  const location = useLocation();
  const search = useStoreActions(actions => actions.search.search);
  let locationQuery = new URLSearchParams(location.search && location.search.substring(1) || '');
  search({type: 'similar', value: params.id, query: locationQuery.get('q')});

  return ( 
    <>
      <List />
    </>
  )
}
