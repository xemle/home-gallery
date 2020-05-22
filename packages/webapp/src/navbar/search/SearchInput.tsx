import * as React from "react";
import { useState } from 'react';

export const SearchInput = ({focus, onSearch}) => {
  const [ query, setQuery ] = useState('');

  return (
    <>
      <div className="button-group -input">
        <input className="input" value={query} onChange={e => setQuery(e.target.value)} onKeyUp={(e) => e.keyCode === 13 && onSearch(query)} ref={input => input && input.focus()} placeholder="Search..."/>
        <button className="button -default" onClick={() => onSearch(query)}><i className="fas fa-search"></i></button>
      </div>
    </>
  )
}