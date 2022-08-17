import * as React from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { NavBar } from '../navbar/NavBar';
import { useStoreState } from "easy-peasy";
import { StoreModel } from '../store/store';


export const Tags = () => {
  const allEntries = useStoreState((state: StoreModel) => state.entries.allEntries);

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
      <NavBar />
      <h2 style={{marginTop: '40px'}}>Tags</h2>
      <ul className="menu">
        {tags.map(tag => {
          return <li key={tag.tag}>
            <Link to={`/search/${tag.tag}`}><i className="fas fa-tag"></i> {tag.tag} - {tag.count}</Link>
          </li>
        })}
      </ul>
    </>
  )
}
