import * as React from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { NavBar } from '../navbar/NavBar';
import { useEntryStore } from '../store/entry-store';

export const Tags = () => {

  const allEntries = useEntryStore(state => state.allEntries);

  const tags = useMemo(() => {
    const tagsCount: {[key: string]: number} = {};
    allEntries.forEach(({tags}) => {
      if (!tags?.length) {
        return
      }

      tags.forEach((tag) => {
        if (!tagsCount[tag]) {
          tagsCount[tag] = 0;
        }
        tagsCount[tag]++;
      })
    });

    return unifyTags(tagsCount)
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

const escapeSearchValue = value => /[\s+]/.test(value) ? `"${value}"` : value

const searchLink = (value) => {
  let query = `tag:${escapeSearchValue(value)}`
  return query
}

const unifyTags = (tagCount: {[key: string]: number}) => {
  const tags = Object.keys(tagCount)

  const normalizedMap: {[key: string]: {tag: string, count:number}[]} = {}
  Object.entries(tagCount).forEach(([tag, count]) => {
    const normalizedTag = tag.toLocaleLowerCase()

    if (!normalizedMap[normalizedTag]) {
      normalizedMap[normalizedTag] = []
    }
    normalizedMap[normalizedTag].push({tag, count})
  })

  return Object.entries(normalizedMap).map(([_, tagCounts]) => {
    if (tagCounts.length == 1) {
      return tagCounts[0]
    } else {
      // sort tag count by count DESC, tag DESC
      tagCounts.sort((a, b) => {
        if (a.count == b.count) {
          return a.tag < b.tag ? 1 : -1
        }
        return a.count < b.count ? 1 : -1
      })

      return {
        tag: tagCounts[0].tag,
        count: tagCounts.reduce((count, t) => count + t.count, 0)
      }
    }
  }).sort((a, b) => a.tag.toLowerCase() < b.tag.toLocaleLowerCase() ? -1 : 1)
}
