import * as React from "react";
import { useHistory } from "react-router-dom";
import { useStoreActions } from '../../store/hooks';
import { useDeviceType, DeviceType } from "../../utils/useDeviceType";
import { MobileSearch } from "./MobileSearch";
import { DesktopSearch } from "./DesktopSearch";


export const SearchNavBar = ({children}) => {
  const [ deviceType ] = useDeviceType();

  const search = useStoreActions(actions => actions.search.search);
  const history = useHistory();

  const onSearch = (query) => {
    history.push(`/search/${query}`);
  }

  return (
    <>
      <div className="nav -top -space">
        { deviceType === DeviceType.MOBILE &&
          <MobileSearch onSearch={onSearch}>
            {children}
          </MobileSearch>
        }
        { deviceType !== DeviceType.MOBILE &&
          <DesktopSearch onSearch={onSearch}>
            {children}
          </DesktopSearch>
        }
      </div>
    </>
  )
}
