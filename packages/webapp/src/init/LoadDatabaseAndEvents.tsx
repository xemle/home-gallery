import React from 'react'
import { useLoadDatabase } from "./useLoadDatabase";
import { useLoadEvents } from "./useLoadEvents";
import { useSearchFilter } from './useSearchFilter';

const LoadDatabaseAndEvents : React.FC<{children: React.ReactNode}> = ({children}) => {
  useLoadEvents()
  useLoadDatabase()
  useSearchFilter()

  return (
    <>
      {children}
    </>
  )
}

export default LoadDatabaseAndEvents