import * as React from "react";
import { useEditModeStore, ViewMode  } from '../store/edit-mode-store'

import { ViewNavBar } from './ViewNavBar';
import { EditNavBar } from './EditNavBar';

export const NavBar = ({disableEdit = false}) => {
  const viewMode = useEditModeStore(state => state.viewMode);

  return (
    <>
      { viewMode === ViewMode.VIEW &&
        <ViewNavBar disableEdit={disableEdit}/>
      }
      { viewMode === ViewMode.EDIT &&
        <EditNavBar />
      }
    </>
  )
}
