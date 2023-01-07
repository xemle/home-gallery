import * as React from "react";

export const MultiTagHelp = ({show, setShow}) => {
  return (
    <>
      {show &&
        <div className="notification -info">
          <button className="button -closeable" onClick={() => setShow(false)}><i className="fas fa-times"></i></button>
          <p>Add single tags with <i className="-high-text">Enter key</i> or <i className="-high-text">comma sign</i>. Prefix tag with <i className="-high-text">minus sign</i> to remove tag from the media. E.g. <i className="-high-text">newTag, -removeTag</i>. Click on the tag to toggle between <i className="-high-text">add</i> and <i className="-high-text">remove</i> action.</p>
        </div>
      }
    </>
  )
}

export const SingleTagHelp = ({show, setShow}) => {
  return (
    <>
      {show &&
        <div className="notification -info">
          <button className="button -closeable" onClick={() => setShow(false)}><i className="fas fa-times"></i></button>
          <p>Add single tags with <i className="-high-text">Enter key</i> or <i className="-high-text">comma sign</i>. E.g. <i className="-high-text">newTag, otherTag</i>.</p>
        </div>
      }
    </>
  )
}