import * as React from "react";
import { useStoreState } from '../store/hooks';

import { ViewMode } from "../store/edit-mode-model";
import { ViewNavBar } from './ViewNavBar';
import { EditNavBar } from './EditNavBar';

export const NavBar = () => {
  const viewMode = useStoreState(state => state.editMode.viewMode);

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
