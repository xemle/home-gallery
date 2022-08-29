import * as React from "react";
import { useMemo, useEffect } from 'react'

import {
  useParams,
} from "react-router-dom";

import { List } from './List';
import { useSearchStore } from '../store/search-store';

export const SearchView = () => {
  const params = useParams();
  const search = useSearchStore(state => state.search);

  const term = useMemo(() => params.term, [params])
  useEffect(() => {
    const value = decodeURIComponent(term);
    search({type: 'query', value});
  }, [term])

  return (
    <>
      <List />
    </>
  )
}
