import { type  Tag } from "../api/models";
import { type TextMatches, type TextMatchSpread, findMatches, getMatchSpreads, mergeMatches, sortSpreads } from "./find-text";

export interface SuggestionPart {
  pos: number
  text: string
  isMatch: boolean
}

export interface TagSuggestion extends Tag {
  active: boolean;
  matches: TextMatches[]
  spreads: TextMatchSpread[]
  parts: SuggestionPart[]
}

export const getParts = (text: string, matches: TextMatches[]) : SuggestionPart[] => {
  const parts: SuggestionPart[] = []
  let lastPos = 0
  for (let i = 0; i < matches.length; i++) {
    const pos = matches[i].pos
    const len = matches[i].text.length
    if (matches[i].pos > lastPos) {
      parts.push({pos: lastPos, text: text.substring(lastPos, pos), isMatch: false})
    }
    parts.push({pos: pos, text: text.substring(pos, pos + len), isMatch: true})
    lastPos = pos + len
  }
  if (lastPos < text.length) {
    parts.push({pos: lastPos, text: text.substring(lastPos), isMatch: false})
  }
  return parts
}

export const getSuggestions = (allTags: string[], value: string = ''): TagSuggestion[] => {
  const active = false
  let remove = false
  let needle = value.replace(/(^\s+|\s+$)/g, '').toLowerCase()

  if (!needle) {
    return allTags.map(name => ({name, remove, active, matches: [], spreads: [], parts: [{pos: 0, text: name, isMatch: false}]}))
  }
  if (needle.startsWith('-')) {
    needle = needle.substring(1)
    remove = true
  }

  return allTags
    .map(name => {
      const matches = findMatches(name, needle)
      const spreads = getMatchSpreads(matches)
      const mergedMatches = mergeMatches(matches)
      const parts = getParts(name, mergedMatches)
      return {name, remove, active, matches: mergedMatches, spreads, parts }
    })
    .filter(m => m.matches.length > 0)
    .sort((a, b) => sortSpreads(a.spreads, b.spreads))
}
