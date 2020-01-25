import * as React from "react";
import {
  BrowserRouter as Router,
  useParams,
  Link
} from "react-router-dom";

import { NavBar } from './NavBar';
import { MediaGrid } from './MediaGrid';

export const Years = ({media}) => {

  const years = media.reduce((result, {year}) => {
    if (result.indexOf(year) < 0) {
      result.push(year);
    }
    return result;
  }, [])
  years.sort((a,b) => b < a ? -1 : 1);

  const style = {
    marginTop: '40px'
  }
  return ( 
    <>
      <NavBar />
      <h2 style={style}>Years</h2>
      <ul>
        {years.map(year => {
          return <li>
            <Link to={`/years/${year}`}>{year}</Link>
            </li>
        })}
      </ul>
    </>
  )
}

export const YearView = ({media}) => {
  const params = useParams();
  const year = +params.year;

  const list = media.filter(m => m.year == year)
  
  return ( 
    <>
      <NavBar />
      <MediaGrid media={list}/>
    </>
  )
}