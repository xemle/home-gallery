import * as React from "react";
import { useState } from "react";
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useEditModeStore, ViewMode } from '../store/edit-mode-store';
import { useTagDialog } from "../dialog/use-tag-dialog";
import { addTags } from '../api/ApiService';
import { useDeviceType, DeviceType } from "../utils/useDeviceType";
import { Tag } from "../api/models";

import { EditNavBar } from './EditNavBar';
import { NavItem } from './NavItem';
import { ViewNavBar } from './ViewNavBar';
import { SearchInput, SearchButton } from "./SearchInput";
import { useAppConfig } from "../utils/useAppConfig";

export const DesktopNavBar = ({disableEdit = false, showDialog}) => {
  const viewMode = useEditModeStore(state => state.viewMode);

  return (
    <>
      <nav className="sticky top-0 z-10 bg-gray-800">
        <div className="mx-auto">
          <div className="relative flex items-center justify-between h-12">
            <div className="flex px-2 space-x-2 overflow-x-visible items-center">
              { viewMode === ViewMode.VIEW && (
                <ViewNavBar disableEdit={disableEdit}/>
              )}
              { viewMode === ViewMode.EDIT && (
                <EditNavBar showDialog={showDialog}/>
              )}
            </div>
            <div className="flex pr-2 space-x-4">
              <SearchInput focus={false} />
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export const MobileNavBar = ({disableEdit = false, showDialog}) => {
  const [showSearch, setShowSearch] = useState(false)
  const viewMode = useEditModeStore(state => state.viewMode);

  return (
    <>
      <nav className="sticky top-0 z-10 bg-gray-800">
        <div className="mx-auto">
          <div className="relative flex items-center justify-between h-12">
            { !showSearch && (
              <>
                <div className="flex px-2 space-x-2 overflow-x-visible items-center">
                  { viewMode === ViewMode.VIEW && (
                    <ViewNavBar disableEdit={disableEdit}/>
                  )}
                  { viewMode === ViewMode.EDIT && (
                    <EditNavBar showDialog={showDialog}/>
                  )}
                </div>
                <div className="flex pr-2 space-x-4">
                  <div className="overflow-hidden border-gray-500 rounded">
                    <SearchButton onClick={() => setShowSearch(true)}/>
                  </div>
                </div>
              </>
            )}
            { showSearch && (
              <>
                <div className="flex px-2 space-x-2 overflow-x-visible grow-0">
                  <NavItem icon={icons.faArrowLeft} onClick={() => setShowSearch(false)} />
                </div>
                <div className="flex pr-2 space-x-4 grow">
                  <div className="overflow-hidden border-gray-500 rounded grow">
                    <SearchInput focus={true} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export const NavBar = ({disableEdit = false}) => {
  const [ deviceType ] = useDeviceType();
  const { setDialogVisible, openDialog } = useTagDialog()

  const selectedIds = useEditModeStore(state => state.selectedIds);

  const onSubmit = ({tags} : {tags: Tag[]}) => {
    const entryIds = Object.entries(selectedIds).filter(([_, selected]) => selected).map(([id]) => id)
    addTags(entryIds, tags).then(() => {
      setDialogVisible(false);
    })

    return false;
  }

  const showDialog = () => {
    openDialog({onSubmit})
  }

  return (
    <>
      { deviceType === DeviceType.DESKTOP &&
        <DesktopNavBar showDialog={showDialog} disableEdit={disableEdit} />
      }
      { deviceType === DeviceType.MOBILE &&
        <MobileNavBar showDialog={showDialog} disableEdit={disableEdit} />
      }
    </>
  )
}
