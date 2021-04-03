import * as React from "react";
import { useMemo } from "react";

import {
  useParams,
  Link,
  useHistory,
  useLocation
} from "react-router-dom";

import { NavBar } from '../navbar/NavBar';
import { List } from '../list/List';
import { useStoreActions } from '../store/hooks';
import { useStoreState } from "easy-peasy";
import { Entry } from '../store/entry-model';

export const Years = () => {
  const allEntries = useStoreState(state => state.entries.allEntries);
  const history = useHistory();

  const years = useMemo(() => {
    const entries: Entry[] = Array.from(allEntries.values());
    const years = entries.reduce((result, {year}) => {
      if (result.indexOf(year) < 0) {
        result.push(year);
      }
      return result;
    }, [])
    years.sort((a,b) => b < a ? -1 : 1);
    return years;
  }, [allEntries]);

  return (
    <>
      <NavBar />
      <h2 style={{marginTop: '40px'}}>Years</h2>
      <ul className="menu">
        {years.map(year => {
          return <li key={year}>
            <Link to={`/years/${year}`}>{year}</Link>
            <a onClick={() => history.push(`/years/${year}?q=image`)}><i className="fas fa-image"></i> <span className="hide-sm">Images</span></a>
            <a onClick={() => history.push(`/years/${year}?q=video`)}><i className="fas fa-play"></i> <span className="hide-sm">Videos</span></a>
          </li>
        })}
      </ul>
    </>
  )
}

export const YearView = () => {
  const params = useParams();
  const location = useLocation();
  const year = +params.year;
  const search = useStoreActions(actions => actions.search.search);
  let locationQuery = new URLSearchParams(location.search && location.search.substring(1) || '');
  search({type: 'year', value: year, query: locationQuery.get('q')});

  return (
    <>
      <List />
    </>
  )
}
