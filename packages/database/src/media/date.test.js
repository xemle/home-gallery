import t from 'tap'

import { getEntryDate } from './date.js'

const entryWithOffset = tzoffsetMinutes => ({
  meta: {
    exif: {
      DateTimeOriginal: { rawValue: '2026:01:05 10:00:00', tzoffsetMinutes }
    }
  }
})

t.test('date', async t => {
  t.test('applies a half-hour zone offset', async t => {
    t.same(getEntryDate(entryWithOffset(330)), '2026-01-05T04:30:00.000Z', '+05:30 (India)')
    t.same(getEntryDate(entryWithOffset(345)), '2026-01-05T04:15:00.000Z', '+05:45 (Nepal)')
    t.same(getEntryDate(entryWithOffset(-210)), '2026-01-05T13:30:00.000Z', '-03:30 (Newfoundland)')
    t.same(getEntryDate(entryWithOffset(60)), '2026-01-05T09:00:00.000Z', '+01:00')
  })
})
