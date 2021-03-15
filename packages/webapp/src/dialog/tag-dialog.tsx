import * as React from "react";
import { useState } from "react";

import { useStoreState } from '../store/hooks';

export interface TagDialogFormData {
  tags: string;
}

export interface TagDialogProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: TagDialogFormData) => void;
}

const Tags = ({tags, addTag}) => {
  return tags.map((tag, i, a) => (
    <a key={i} onClick={() => addTag(tag)} className="mr-4" title={`Click to tag '${tag}'`}>{tag}{i < a.length - 1 ? ',' : ''}</a>
  ))
}

export const TagDialog = ({onCancel, onSubmit, visible}: TagDialogProps) => {
  const [tags, setTags] = useState("");
  const recentTags = useStoreState(state => state.events.recentTags);

  const submitHandler = (event) => {
    event.preventDefault();
    onSubmit({ tags });
  }

  const addTag = tag => setTags(value => {
    const match = value.match(new RegExp(`\\b(${tag}\\s*(,\\s*)?)`))
    if (match) {
      return value.replace(match[1], '');
    }

    const strip = value.replace(/\s*,\s*$/, '')
    if (strip.length) {
      return `${strip}, ${tag}`
    }
    return tag;
  });

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
                  {recentTags.length &&
                    <div>
                      Recent tags: <Tags tags={recentTags.slice(0, 5)} addTag={addTag} />
                    </div>}
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

