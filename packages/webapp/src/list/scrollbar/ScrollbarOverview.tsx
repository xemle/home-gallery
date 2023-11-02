import * as React from "react"
import { classNames } from "../../utils/class-names"

const typeToClass = {
  text: '-text',
  current: '-current',
  circle: '-circle',
  fullCircle: '-circle -full'
}

const typeClass = type => typeToClass[type] || '-circle'

export const ScrollbarOverview = ({overviewItems, show}) => {
  return (
    <>
      <div className={classNames('absolute right-0 top-0 bottom-0 w-36 bg-gray-900/50', {hidden: !show})}>
        {overviewItems.map(({type, top, text}, index) => (
          <div key={`${index}-${top}`} className={classNames('absolute inline-flex justify-center left-2 right-2 mr-9 ')} style={{top}}>
            <span className="px-2 py-1 text-sm text-gray-400 rounded bg-gray-800/70">{text}</span>
          </div>
        ))}
      </div>
    </>
  )
}