import { RefObject } from 'react'

export interface ScrollbarOverviewItem {
  type: 'text' | 'circle' | 'fullCircle' | 'current'
  top: number
  text?: string
}

export type VisibleHandle = 'full' | 'partial' | 'hidden'

export interface ScrollbarState {
  containerRef: RefObject<any>,
  pageHeight: number,

  handleTop: number,
  handleTopDraggingStart: number,
  handleHeight: number,
  visibleHandle: VisibleHandle,
  showHandleDetail: boolean,
  isDragging: boolean,
  handleDetailText: string,
  detailTextFn: (number) => string,

  overviewItems: ScrollbarOverviewItem[]
  showOverview: boolean,
}

export const initialState: ScrollbarState = {
  containerRef: { current: null },
  pageHeight: 800,

  handleTop: 0,
  handleTopDraggingStart: 0,
  handleHeight: 50,
  visibleHandle: 'hidden',
  showHandleDetail: false,
  isDragging: false,
  handleDetailText: '',
  detailTextFn: (top: number) => '',

  overviewItems: [],
  showOverview: false,
}

const getScrollMax = (container) => {
  if (container === window) {
    return document.body.getBoundingClientRect().height - window.innerHeight
  } else if (typeof container?.getBoundingClientRect == 'function') {
    return container?.getBoundingClientRect().height
  } else {
    return 0
  }
}

const getHandleTop = (scrollTop, scrollTopMax, pageHeight, handleHeight) => scrollTopMax > 0 ? (pageHeight - handleHeight) * (Math.min(scrollTop, scrollTopMax) / scrollTopMax) : 0

const getScrollTop = (scrollTopMax, handleTop, pageHeight, handleHeight) => {
  if (scrollTopMax > 0 && pageHeight - handleHeight > 0) {
    return +(scrollTopMax * handleTop / (pageHeight - handleHeight)).toFixed()
  } else {
    return 0
  }
}

type ScrollbarActionPageUpDown = {
  type: 'pageUp' | 'pageDown'
}

type ScrollbarActionScrollTo = {
  type: 'scrollTo',
  scrollTop: number
}

type Position = {
  x: number
  y: number
}

type ScrollbarActionHandleDragging = {
  type: 'handleDragging'
  isDragging: boolean
  start: Position
  current: Position
}

type ScrollbarActionPageHeight = {
  type: 'pageHeight'
  pageHeight: number
}

type ScrollbarActionHandleHeight = {
  type: 'handleHeight'
  handleHeight: number
}

type ScrollbarActionShowHandle = {
  type: 'showHandle'
  visibleHandle: VisibleHandle
}

type ScrollbarActionShowHandleDetail = {
  type: 'showHandleDetail'
  showHandleDetail: boolean
}

type ScrollbarActionOverviewItems = {
  type: 'overviewItems'
  overviewItems: ScrollbarOverviewItem[],
  detailTextFn: (scrollTop: number) => string
}

type ScrollbarActionShowOverview = {
  type: 'showOverview'
  showOverview: boolean
}

export type ScrollbarActions = ScrollbarActionPageUpDown
  | ScrollbarActionScrollTo
  | ScrollbarActionHandleDragging
  | ScrollbarActionPageHeight
  | ScrollbarActionHandleHeight
  | ScrollbarActionShowHandle
  | ScrollbarActionShowHandleDetail
  | ScrollbarActionOverviewItems
  | ScrollbarActionShowOverview

export const reducer = (state: ScrollbarState, action: ScrollbarActions) => {
  switch (action.type) {
    case 'pageUp': {
      const container = state.containerRef?.current
      if (!container) {
        break
      }
      const scrollLeft = container.scrollLeft || container.scrollX
      let scrollTop = container.scrollTop || container.scrollY
      const scrollTopMax = getScrollMax(container)
      scrollTop = Math.max(0, +(scrollTop - state.pageHeight).toFixed())

      const handleTop = getHandleTop(scrollTop, scrollTopMax, state.pageHeight, state.handleHeight)
      const handleDetailText = state.detailTextFn(scrollTop)
      container.scrollTo(scrollLeft, scrollTop)
      state = {...state, handleTop, handleDetailText }
      break
    }
    case 'pageDown': {
      const container = state.containerRef?.current
      if (!container) {
        break
      }
      const scrollLeft = container.scrollLeft || container.scrollX
      let scrollTop = container.scrollTop || container.scrollY
      const scrollTopMax = getScrollMax(container)
      scrollTop = Math.min(scrollTopMax, +(scrollTop + state.pageHeight).toFixed())

      const handleTop = getHandleTop(scrollTop, scrollTopMax, state.pageHeight, state.handleHeight)
      const handleDetailText = state.detailTextFn(scrollTop)
      container.scrollTo(scrollLeft, scrollTop)
      state = {...state, handleTop, handleDetailText }
      break
    }
    case 'scrollTo': {
      const container = state.containerRef?.current
      if (!container || state.isDragging) {
        break
      }
      const scrollTopMax = getScrollMax(container)

      const handleTop = getHandleTop(action.scrollTop, scrollTopMax, state.pageHeight, state.handleHeight)
      const handleDetailText = state.detailTextFn(action.scrollTop)
      state = {...state, handleTop, handleDetailText }
      break
    }
    case 'handleDragging': {
      const container = state.containerRef?.current
      if (!container) {
        break;
      }
      if (state.isDragging != action.isDragging) {
        return {...state, isDragging: action.isDragging, handleTopDraggingStart: state.handleTop}
      } else if (!action.isDragging) {
        return state
      }

      const handleTop = Math.max(0, Math.min(state.pageHeight - state.handleHeight, state.handleTopDraggingStart + action.current.y - action.start.y))

      const scrollLeft = container.scrollLeft || container.scrollX
      const scrollTopMax = getScrollMax(container)
      const scrollTop = getScrollTop(scrollTopMax, handleTop, state.pageHeight, state.handleHeight)

      const handleDetailText = state.detailTextFn(scrollTop)
      container.scrollTo(scrollLeft, scrollTop)
      state = {...state, handleTop, handleDetailText }
      break
    }
    case 'pageHeight': {
      const container = state.containerRef?.current
      if (!container) {
        state = {...state, pageHeight: action.pageHeight }
        break
      }
      let scrollTop = container.scrollTop || container.scrollY
      const scrollTopMax = getScrollMax(container)

      const handleTop = getHandleTop(scrollTop, scrollTopMax, action.pageHeight, state.handleHeight)
      const handleDetailText = state.detailTextFn(scrollTop)
      state = {...state, pageHeight: action.pageHeight, handleTop, handleDetailText }
      break
    }
    case 'handleHeight': {
      const container = state.containerRef?.current
      if (!container) {
        state = {...state, handleHeight: action.handleHeight }
        break
      }
      let scrollTop = container.scrollTop || container.scrollY
      const scrollTopMax = getScrollMax(container)

      const handleTop = getHandleTop(scrollTop, scrollTopMax, state.pageHeight, action.handleHeight)
      const handleDetailText = state.detailTextFn(scrollTop)
      state = {...state, handleHeight: action.handleHeight, handleTop, handleDetailText }
      break
    }
    case 'showHandle': {
      state = {...state, visibleHandle: action.visibleHandle }
      break
    }
    case 'showHandleDetail': {
      state = {...state, showHandleDetail: action.showHandleDetail }
      break
    }
    case 'overviewItems': {
      state = {...state, overviewItems: action.overviewItems, detailTextFn: action.detailTextFn }
      break
    }
    case 'showOverview': {
      state = {...state, showOverview: action.showOverview }
      break
    }
    default: {
      console.log(`Unknown action ${action}`)
    }
  }
  return state
}
