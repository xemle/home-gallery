import * as React from "react";
import { useMemo, useEffect } from "react";

import {
  useParams,
  Link,
  useNavigate,
  useLocation
} from "react-router-dom";

import { NavBar } from '../navbar/NavBar';
import { List } from '../list/List';
import { useEntryStore } from '../store/entry-store'
import { useSearchStore } from '../store/search-store'

interface YearInfo {
  year: number,
  count: number,
  images: number,
  videos: number
}

export const Years = () => {
  const allEntries = useEntryStore(state => state.allEntries);
  const navigate = useNavigate();

  const yearInfos: YearInfo[] = useMemo(() => {
    const year2info = allEntries.reduce((result, {type, date}) => {
      const year = date.substring(0, 4) || '1970'
      if (!result[year]) {
        result[year] = { year: +year, count: 0, images: 0, videos: 0 }
      }
      const info = result[year]
      info.count++
      switch (type) {
        case 'image':
        case 'rawImage': info.images++; break;
        case 'video': info.videos++
      }
      return result;
    }, [])

    return Object.values(year2info).sort((a, b) => b.year - a.year)
  }, [allEntries]);

  return (
    <>
      <NavBar disableEdit={true} />
      <h2 style={{marginTop: '40px'}}>Years</h2>
      <ul className="menu">
        {yearInfos.map(({year, count, images, videos}) => {
          return <li className="-list" key={year}>
            <Link to={`/years/${year}`}>{year} - {count} media</Link>
            { images > 0 &&
              <a onClick={() => navigate(`/years/${year}?q=image`)}><i className="fas fa-image"></i> <span className="hide-sm">{images} images</span></a>
            }
            { videos > 0 &&
              <a onClick={() => navigate(`/years/${year}?q=video`)}><i className="fas fa-play"></i> <span className="hide-sm">{videos} videos</span></a>
            }
          </li>
        })}
      </ul>
    </>
  )
}

export const YearView = () => {
  const params = useParams();
  const location = useLocation();
  const search = useSearchStore(state => state.search);

  useEffect(() => {
    const year = +params.year;
    let locationQuery = new URLSearchParams(location.search && location.search.substring(1) || '');
    search({type: 'year', value: year, query: locationQuery.get('q') || ''});
  }, [params, location])

  return (
    <>
      <List />
    </>
  )
}
