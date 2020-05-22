import * as React from "react";

import { SearchInput } from './SearchInput';

export const DesktopSearch = ({children, onSearch}) => {
  return (
    <>
      {children}
      <SearchInput focus={false} onSearch={onSearch} />
    </>
  )
}