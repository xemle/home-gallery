import * as React from "react";
import { useEffect } from "react";
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useSearchStore } from "../store/search-store";

export const SearchButton = ({onClick}) => {
  return (
    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-500 hover:cursor-pointer" onClick={onClick}>
      <FontAwesomeIcon icon={icons.faSearch} className="text-gray-300"/>
    </button>
  )
}

export const SearchInput = ({focus}) => {
  const query = useSearchStore(state => state.query);

  const [ term, setTerm ] = useState(query.type == 'query' ? query.value : query.query || '');

  const navigate = useNavigate();

  const onSearch = (termInput) => {
    if (!termInput) {
      navigate(`/`);
    } else if (query.type == 'none' || query.type == 'query') {
      navigate(`/search/${termInput}`);
    } else if (query.type == 'year') {
      navigate(`/years/${query.value}?q=${termInput}`);
    } else if (query.type == 'similar') {
      navigate(`/similar/${query.value}?q=${termInput}`);
    } else if (query.type == 'faces') {
      navigate(`/faces/${query.value.id}/${query.value.faceIndex}?q=${termInput}`);
    }
  }

  const onChange = e => setTerm(e.target.value)

  const onKeyUp = e => e.keyCode === 13 && onSearch(term)

  useEffect(() => {
    const queryTerm = query.type == 'query' ? query.value : query.query
    setTerm(queryTerm)
  }, [query])

  return (
    <>
      <div className="flex gap-2 overflow-hidden border border-gray-500 rounded focus-within:border-gray-300 hover:cursor-pointer">
        <input className="flex-1 px-2 text-gray-300 bg-transparent border-0 focus:border-transparent focus:ring-0 focus:outline-none" value={term || ''} onChange={onChange} onKeyUp={onKeyUp} ref={input => input && focus && input.focus()} placeholder="Search..."/>
        <SearchButton onClick={() => onSearch(term)} />
      </div>
    </>
  )
}