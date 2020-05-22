import * as React from "react";
import { useState } from "react";

export interface TagDialogFormData {
  tags: string;
}

export interface TagDialogProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: TagDialogFormData) => void;
}

export const TagDialog = ({onCancel, onSubmit, visible}: TagDialogProps) => {
  const [tags, setTags] = useState("");

  const submitHandler = (event) => {
    event.preventDefault();
    onSubmit({ tags });
  }

  return (
    <div className={`modal ${visible ? '-visible' : ''}`}>
      <div className="modal__backdrop"></div>
      <div className="modal__overlay">
        <div className="dialog text">
          <div className="dialog__header -closeable">
            <h3>Edit Tags</h3>
            <button className="button -closeable" onClick={onCancel}><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={submitHandler}>
            <div className="dialog__scroll-container">
              <div className="dialog__content">
                <div className="field">
                  <label htmlFor="tags">Input</label>
                  <input id="tags" className="input" ref={input => input && input.focus()} value={tags} onChange={e => setTags(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="dialog__footer -grey">
              <div className="button-group -right">
                <button className="button -primary">Submit</button>
                <a className="link button -link" onClick={onCancel}>Cancel</a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

