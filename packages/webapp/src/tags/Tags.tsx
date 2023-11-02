import * as React from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { NavBar } from '../navbar/NavBar';
import { useEntryStore } from '../store/entry-store';


export const Tags = () => {
  const escapeSearchValue = value => /[\s+]/.test(value) ? `"${value}"` : value

  const searchLink = (value) => {
    let query = `tag:${escapeSearchValue(value)}`
    return query
  }

  const allEntries = useEntryStore(state => state.allEntries);

  const tags = useMemo(() => {
    const tagsCount = {};
    allEntries.forEach(({tags}) => {
      if (tags) {
        tags.forEach((tag) => {
          if (tagsCount[tag]) {
            tagsCount[tag] += 1;
          } else {
            tagsCount[tag] = 1;
          }
        })
      }
    });

    const allTags = Object.keys(tagsCount).map((k) => {
      return {
        tag: k,
        count: tagsCount[k]
      };
    })
    allTags.sort((a,b) => a.tag.toLowerCase() < b.tag.toLowerCase() ? -1 : 1);
    return allTags;
  }, [allEntries]);

  return (
    <>
      <NavBar disableEdit={true} />
      <h2 className="m-4 text-xl text-gray-400">Tags</h2>
      <ul className="m-4">
        {tags.map(tag => {
            let query = searchLink(tag.tag)
            return (
              <li className="border border-collapse border-gray-800" key={tag.tag}>
                <Link className="block p-4 text-gray-500 hover:text-gray-300 hover:bg-gray-700 hover:cursor-pointer"
                  to={`/search/${query}`}>
                  <span className="flex items-center justify-start gap-2 ">
                    <FontAwesomeIcon icon={icons.faTag} />
                    <span>{tag.tag} - {tag.count}</span>
                  </span>
                </Link>
              </li>
            )
        })}
      </ul>
    </>
  )
}
