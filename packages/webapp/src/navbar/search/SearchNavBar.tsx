import * as React from "react";
import { useHistory } from "react-router-dom";
import { useSearchStore } from "../../store/search-store";
import { useDeviceType, DeviceType } from "../../utils/useDeviceType";
import { MobileSearch } from "./MobileSearch";
import { DesktopSearch } from "./DesktopSearch";


export const SearchNavBar = ({children}) => {
  const [ deviceType ] = useDeviceType();

  const query = useSearchStore(state => state.query);
  const history = useHistory();

  const onSearch = (queryInput) => {
    if (!queryInput) {
      history.push(`/`);
    } else if (query.type == 'none' || query.type == 'query') {
      history.push(`/search/${queryInput}`);
    } else if (query.type == 'year') {
      history.push(`/years/${query.value}?q=${queryInput}`);
    } else if (query.type == 'similar') {
      history.push(`/similar/${query.value}?q=${queryInput}`);
    } else if (query.type == 'faces') {
      history.push(`/faces/${query.value.id}/${query.value.faceIndex}?q=${queryInput}`);
    }
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
