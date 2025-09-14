import * as React from "react";
import {
  Navigate,
  Routes,
  Route,
} from "react-router-dom";


import { AllView } from "./list/All";
import { SearchView } from './list/Search';
import { SimilarView } from './list/Similar';
import { FacesView } from './list/Faces';
import { Years, YearView } from './year/Years';
import { Tags } from './tags/Tags';
import { Map } from './map';
import { MediaView } from './single/MediaView';
import { useAppConfig } from "./utils/useAppConfig";

export const AppRoutes = () => {
  const appConfig = useAppConfig();

  return (
    <Routes>
      <Route path="/" element={<AllView />} />
      <Route path="/view/:id" element={<MediaView />} />
      <Route path="/search/:term" element={<SearchView />} />

      {/* Optional pages routes */}
      {!appConfig.disabledYearsPage && <Route path="/years" element={<Years />} />}
      {!appConfig.disabledYearsPage && <Route path="/years/:year" element={<YearView />} />}
      {!appConfig.disabledSimilarPage && <Route path="/similar/:id" element={<SimilarView />} />}
      {!appConfig.disabledFacesPage && <Route path="/faces/:id/:faceIndex" element={<FacesView />} />}
      {!appConfig.disabledTagsPage && <Route path="/tags" element={<Tags />} />}
      {!appConfig.disabledMapPage && <Route path="/map" element={<Map />} />}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
