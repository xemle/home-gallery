import * as React from "react";
import { useMemo, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

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
      <h2 className="m-4 text-xl text-gray-400">Years</h2>
      <ul className="m-4">
        {yearInfos.map(({year, count, images, videos}) => {
          return <li className="flex gap-2 border border-collapse border-gray-800" key={year}>
            <Link to={`/years/${year}`} className="p-4 text-gray-500 hover:text-gray-300 hover:bg-gray-700">{year} - {count} media</Link>
            { images > 0 &&
              <a className="inline-flex items-center justify-center gap-2 p-4 text-gray-500 hover:text-gray-300 hover:bg-gray-700 hover:cursor-pointer"
                 onClick={() => navigate(`/years/${year}?q=type:image`)}>
                <FontAwesomeIcon icon={icons.faImage} />
                <span>{images} <span className="max-sm:hidden">images</span></span>
              </a>
            }
            { videos > 0 &&
              <a className="inline-flex items-center justify-center gap-2 p-4 text-gray-500 hover:text-gray-300 hover:bg-gray-700 hover:cursor-pointer"
                 onClick={() => navigate(`/years/${year}?q=type:video`)}>
                <FontAwesomeIcon icon={icons.faPlay} />
                <span>{videos} <span className="max-sm:hidden">videos</span></span>
              </a>
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
