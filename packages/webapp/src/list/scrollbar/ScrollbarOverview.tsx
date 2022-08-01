import * as React from "react"

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
      <div className={`scrollbar_overview ${show ? '' : '-hidden'}`}>
        {overviewItems.map(({type, top, text}, index) => (
          <div key={`${index}-${top}`} className={`scrollbar_overview-item ${typeClass(type )}`} style={{top}}><span>{text}</span></div>
        ))}
      </div>
    </>
  )
}