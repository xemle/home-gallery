import * as React from "react";
import { useState } from "react";

const Tags = ({tags, addTag} : { tags: string[], addTag: (tag: string) => void}) => {
  return tags.map((tag, i) => (
    <span key={tag} onClick={() => addTag(tag)} className="px-2 py-1 text-sm text-gray-300 bg-gray-700 rounded hover:bg-gray-600 hover:cursor-pointer" title={`Click to tag '${tag}'`}><span>{tag}</span></span>
  ))
}

export const RecentTags = ({tags, dispatch}: {tags: string[], dispatch: Function}) => {
  const [tagCount, setTagCount] = useState(15)

  if (!tags.length) {
    return (<></>)
  }

  return (
    <>
      <p className="text-gray-500">Recent tags:</p>
      <p className="flex flex-wrap items-center justify-start gap-2"><Tags tags={tags.slice(0, tagCount).sort()} addTag={tag => dispatch({type: 'addTag', value: tag})} />
        { tagCount < tags.length &&
          <a
            className="text-gray-500 hover:text-gray-300 hover:cursor-pointer"
            onClick={() => setTagCount(count => 2 * count)}>show more...</a>
        }
      </p>
    </>
  )
}
