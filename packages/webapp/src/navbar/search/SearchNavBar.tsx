import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useSearchStore } from "../../store/search-store";
import { useDeviceType, DeviceType } from "../../utils/useDeviceType";
import { MobileSearch } from "./MobileSearch";
import { DesktopSearch } from "./DesktopSearch";


export const SearchNavBar = ({children}) => {
  const [ deviceType ] = useDeviceType();

  const query = useSearchStore(state => state.query);
  const navigate = useNavigate();

  const onSearch = (queryInput) => {
    if (!queryInput) {
      navigate(`/`);
    } else if (query.type == 'none' || query.type == 'query') {
      navigate(`/search/${queryInput}`);
    } else if (query.type == 'year') {
      navigate(`/years/${query.value}?q=${queryInput}`);
    } else if (query.type == 'similar') {
      navigate(`/similar/${query.value}?q=${queryInput}`);
    } else if (query.type == 'faces') {
      navigate(`/faces/${query.value.id}/${query.value.faceIndex}?q=${queryInput}`);
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
