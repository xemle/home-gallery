import * as React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

export const MultiTagHelp = ({show, setShow}) => {
  return (
    <>
      {show &&
        <div className="relative p-4 border rounded bg-info-800 border-info-900">
          <button className="absolute flex items-center justify-center w-8 h-8 rounded top-2 right-4 hover:bg-gray-800/50 active:bg-gray-800/70" onClick={() => setShow(false)}><FontAwesomeIcon icon={icons.faTimes} className="text-info-950" /></button>
          <p className="text-gray-400">Add single face tags with <i className="text-gray-200">Enter key</i> or <i className="text-gray-200">comma sign</i>. Prefix tag with <i className="text-gray-200">minus sign</i> to remove tag from the media. E.g. <i className="text-gray-200">newTag, -removeTag</i>. Click on the tag to toggle between <i className="text-gray-200">add</i> and <i className="text-gray-200">remove</i> action.</p>
        </div>
      }
    </>
  )
}

export const SingleTagHelp = ({show, setShow}) => {
  return (
    <>
      {show &&
        <div className="relative p-4 border rounded bg-info-800 border-info-900">
          <button className="absolute flex items-center justify-center w-8 h-8 rounded top-2 right-4 hover:bg-gray-800/50 active:bg-gray-800/70" onClick={() => setShow(false)}><FontAwesomeIcon icon={icons.faTimes} className="text-info-950" /></button>
          <p className="text-gray-400">Add single face tags with <i className="text-gray-200">Enter key</i> or <i className="text-gray-200">comma sign</i>. E.g. <i className="text-gray-200">newTag, otherTag</i>.</p>
        </div>
      }
    </>
  )
}