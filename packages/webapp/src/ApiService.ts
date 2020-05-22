
import { pushEvent } from './api';

const tagToAction = (tag: string) => {
  if (tag.substr(0, 1) === '-') {
    return {action: 'removeTag', value: tag.substring(1)}
  } else {
    return {action: 'addTag', value: tag}
  }
}

export const addTags = async (entryIds: String[], tagInput: string) => {
  const actions = tagInput
      .replace(/(^\s+|\s+$)/g, '')
      .split(/\s*,\s*/)
      .map(tagToAction);
  const event = {type: 'userAction', targetIds: entryIds, actions };
  console.log(`push event `, event);
  return pushEvent(event);
}
