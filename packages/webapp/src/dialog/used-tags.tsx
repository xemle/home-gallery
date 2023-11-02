import * as React from "react";
import { useState, useMemo } from "react";

export type UsedTagsProps = {
  title: string;
  tags: {name: string, count: number}[];
  initialCount: number;
  dispatch: Function;
}

export const UsedTags = ({title, tags, initialCount, dispatch}: UsedTagsProps) => {
  const [tagCount, setTagCount] = useState(initialCount)

  if (!tags.length) {
    return (<></>)
  }

  const mostUsedTags = useMemo(() => {
    const byCountDesc = (a, b) => b.count - a.count
    const byName = (a, b) => a.name < b.name ? -1 : 1

    return tags
      .sort(byCountDesc)
      .slice(0, tagCount)
      .sort(byName)
  }, [tags, tagCount])

  return (
    <>
      <p className="text-gray-500">{title}</p>
      <p className="flex flex-wrap items-center justify-start gap-2">
        {mostUsedTags.map(tag => (
          <span
            key={tag.name}
            onClick={() => dispatch({type: 'addTag', value: tag.name})}
            className="inline-flex gap-2 px-2 py-1 text-sm text-gray-300 bg-gray-700 rounded hover:bg-gray-600 hover:cursor-pointer"
            title={`Click to tag '${tag.name}'`}
            ><span>{tag.name}</span> <span className="text-gray-500">x{tag.count}</span></span>
        ))}
        { tagCount < tags.length &&
          <a
            className="text-gray-500 hover:text-gray-300 hover:cursor-pointer"
            onClick={() => setTagCount(count => 2 * count)}>show more...</a>
        }
      </p>
    </>
  )
}