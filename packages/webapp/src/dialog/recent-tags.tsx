import * as React from "react";
import { useState } from "react";

const Tags = ({tags, addTag} : { tags: string[], addTag: (tag: string) => void}) => {
  return tags.map((tag, i) => (
    <span key={tag} onClick={() => addTag(tag)} className="mr-4 tag -button" title={`Click to tag '${tag}'`}><span>{tag}</span></span>
  ))
}

export const RecentTags = ({tags, dispatch}: {tags: string[], dispatch: Function}) => {
  const [recentTagCount, setRecentTagCount] = useState(15)

  if (!tags.length) {
    return (<></>)
  }

  return (
    <>
      <p>Recent tags:</p>
      <p style={{lineHeight: '1.7rem'}}><Tags tags={tags.slice(0, recentTagCount).sort()} addTag={tag => dispatch({type: 'addTag', value: tag})} />
        { recentTagCount < tags.length &&
          <a onClick={() => setRecentTagCount(count => 2 * count)}>show more...</a>
        }
      </p>
    </>
  )
}