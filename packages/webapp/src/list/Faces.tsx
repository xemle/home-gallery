import * as React from "react";
import { useEffect } from "react";

import {
  useParams,
  useLocation
} from "react-router-dom";

import { List } from './List';
import { useSearchStore } from '../store/search-store';

export const FacesView = () => {
  const params = useParams();
  const location = useLocation();
  const search = useSearchStore(state => state.search);

  useEffect(() => {
    let locationQuery = new URLSearchParams(location.search && location.search.substring(1) || '');
    const value = {id: params.id, faceIndex: params.faceIndex};
    search({type: 'faces', value, query: locationQuery.get('q') || ''});
  }, [params, location])

  return (
    <>
      <List />
    </>
  )
}
