export interface TextMatches {
  pos: number
  text: string
  i: number
  gap: number
}

export interface TextMatchSpread {
  pos: number
  spread: number
}

export const findMatches = (text: string, needle: string): TextMatches[] => {
  const lowerText = text.toLowerCase()
  let i = 0
  let pos = lowerText.indexOf(needle[i % needle.length])
  let lastPos = pos - 1
  const matches = []
  while (pos >= 0) {
    matches.push({
      pos,
      text: text.substring(pos, pos + 1),
      i: i % needle.length,
      gap: pos - lastPos - 1
    })
    i++
    lastPos = pos
    pos = lowerText.indexOf(needle[i % needle.length], pos + 1)
  }

  // drop partial matches
  while (matches.length && matches[matches.length - 1].i != needle.length - 1) {
    matches.pop()
  }
  return matches
}

export const sortMatches = (a: TextMatches[], b: TextMatches[]) => {
  const len = b.length - a.length
  if (len != 0) {
    return len
  }

  for (let i = 0; i < a.length; i++) {
    const pos = a[i].pos - b[i].pos
    if (pos != 0) {
      return pos
    }
  }

  return 0
}

export const mergeMatches = (matches: TextMatches[]) => matches.reduce((result, match) => {
  if (!result.length) {
    result.push(match)
  } else {
    const last = result[result.length - 1]
    if (last.pos + last.text.length == match.pos && last.i + last.text.length == match.i) {
      last.text += match.text
    } else {
      result.push(match)
    }
  }
  return result
}, [] as TextMatches[])

export const getMatchSpreads = (matches: TextMatches[]): TextMatchSpread[] => {
  const words = matches.reduce((words, match) => {
    if (match.i == 0) {
      words.push([match])
    } else {
      words[words.length -1].push(match)
    }
    return words
  }, [] as TextMatches[][])

  return words.map(matches => {
    const pos = matches[0].pos
    const gapAvg = matches.reduce((sum, match) => match.i == 0 ? sum : sum + match.gap, 0) / matches.length
    return {pos, spread: gapAvg / matches.length }
  }).sort((a, b) => a.spread - b.spread)
}

export const sortSpreads = (a: TextMatchSpread[], b: TextMatchSpread[]) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    let cmp = a[i].spread - b[i].spread
    if (cmp != 0) {
      return cmp
    }
    cmp = a[i].pos - b[i].pos
    if (cmp != 0) {
      return cmp
    }
  }

  return a.length - b.length
}
