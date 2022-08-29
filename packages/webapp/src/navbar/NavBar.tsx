import * as React from "react";
import { useEditModeStore, ViewMode  } from '../store/edit-mode-store'

import { ViewNavBar } from './ViewNavBar';
import { EditNavBar } from './EditNavBar';

export const NavBar = () => {
  const viewMode = useEditModeStore(state => state.viewMode);

  return (
    <>
      { viewMode === ViewMode.VIEW &&
        <ViewNavBar />
      }
      { viewMode === ViewMode.EDIT &&
        <EditNavBar />
      }
    </>
  )
}
