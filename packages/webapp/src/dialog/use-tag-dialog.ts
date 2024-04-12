import * as React from "react";

import { DialogContext } from './dialog-provider'

export const useTagDialog = () => {
  const context = React.useContext(DialogContext)
  if (context == undefined) {
    throw new Error('useTagDialog must be used within a UserProvider')
  }
  return context
}