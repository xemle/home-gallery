import React from 'react'
import { useLoadDatabase } from "./useLoadDatabase";
import { useLoadEvents } from "./useLoadEvents";

const LoadDatabaseAndEvents : React.FC<{children: React.ReactNode}> = ({children}) => {
  useLoadEvents()
  useLoadDatabase()

  return (
    <>
      {children}
    </>
  )
}

export default LoadDatabaseAndEvents