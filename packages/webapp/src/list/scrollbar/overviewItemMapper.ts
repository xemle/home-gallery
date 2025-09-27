import { type ScrollbarOverviewItem } from "./state"

import { formatDate } from '../../utils/format'

const isInDateOrder = items => {
  const isDesc = items[0].date > items[items.length - 1].date
  const outOfOrderItem = items.find((item, i, a) => {
    if (i == 0) {
      return false
    }
    const prevItem = a[i - 1]
    return prevItem.date != item.date && isDesc != prevItem.date > item.date
  })
  return !outOfOrderItem
}

const HOUR_MS = 1000 * 60 * 60
const DAY_MS = HOUR_MS * 24

const setDateValue = items => {
  const firstDate = new Date(items[0].date)
  const lastDate = new Date(items[items.length - 1].date)
  const diff = Math.abs(lastDate.getTime() - firstDate.getTime())
  const hourDiff = Math.ceil(diff / HOUR_MS)
  const dayDiff = Math.ceil(diff / DAY_MS)

  let dateValueFn: (date: Date) => string
  if (hourDiff < 6) {
    dateValueFn = date => formatDate('%H:%M:%S', date)
  } else if (hourDiff <= 24) {
    dateValueFn = date => formatDate('%H:%M', date)
  } else if (dayDiff < 90) {
    dateValueFn = date => formatDate('%d.%m.%y', date)
  } else if (dayDiff < 700) {
    dateValueFn = date => formatDate('%b %Y', date)
  } else {
    dateValueFn = date => formatDate('%Y', date)
  }

  items.forEach(item => item.dateValue = dateValueFn(item.date))
}

export interface TopDateItem {
  top: number,
  height: number,
  date: string,
  dateValue: string
}

export const overviewItemMapper = (topDateItems: TopDateItem[], viewHeight: number, padding: number): [ScrollbarOverviewItem[], (number) => string] => {
  if (!topDateItems.length) {
    return [[], () => '']
  }

  if (!isInDateOrder(topDateItems)) {
    return [[], () => '']
  }
  setDateValue(topDateItems)

  const lastItem = topDateItems[topDateItems.length - 1]
  const maxTop = (lastItem.top + lastItem.height) - viewHeight

  const itemTopToOverviewTop = top => padding + (viewHeight - 2 * padding) * top / maxTop

  const isNextOverviewItem = (lastOverviewItem, item) => {
    if (!lastOverviewItem) {
      return true
    }
    // Skip on same date value
    if (lastOverviewItem.text == item.dateValue) {
      return false
    }
    // Skip if distance is to low
    const overviewTop = itemTopToOverviewTop(item.top)
    if (overviewTop - lastOverviewItem.top < 30) {
      return false
    }

    return true
  }

  const overviewItems: ScrollbarOverviewItem[] = []
  let lastOverviewItem: ScrollbarOverviewItem
  for (let i = 0; i < topDateItems.length; i++) {
    const item = topDateItems[i]
    if (isNextOverviewItem(lastOverviewItem, item)) {
      lastOverviewItem = {type: 'text', top: itemTopToOverviewTop(item.top), text: item.dateValue}
      overviewItems.push(lastOverviewItem)
    }
  }

  const detailTextFn = (scrollTop) => {
    const lastItem = topDateItems.filter(item => item.top <= scrollTop).pop()
    return `${lastItem?.date ? formatDate('%d.%m.%y', lastItem?.date) : ''}`
  }

  return [overviewItems, detailTextFn]
}
