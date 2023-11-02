import * as React from "react";

import { TagDialogContext } from './tag-dialog-provider'

export const useTagDialog = () => {
  const context = React.useContext(TagDialogContext)
  if (context == undefined) {
    throw new Error('useTagDialog must be used within a UserProvider')
  }
  return context
}