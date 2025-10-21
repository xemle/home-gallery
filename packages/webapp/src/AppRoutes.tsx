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
import { useAppConfig } from "./config/useAppConfig";

export const AppRoutes = () => {
  const appConfig = useAppConfig();

  return (
    <Routes>
      <Route path="/" element={<AllView />} />
      <Route path="/view/:id" element={<MediaView />} />
      <Route path="/share/:id" element={<MediaView />} />
      <Route path="/search/:term" element={<SearchView />} />

      {/* Optional pages routes */}
      {!appConfig.pages?.disabled?.includes('date') && <Route path="/years" element={<Years />} />}
      {!appConfig.pages?.disabled?.includes('date') && <Route path="/years/:year" element={<YearView />} />}
      {!appConfig.pages?.disabled?.includes('tag') && <Route path="/tags" element={<Tags />} />}
      {!appConfig.pages?.disabled?.includes('map') && <Route path="/map" element={<Map />} />}

      {/* Conditional routes */}
      {<Route path="/similar/:id" element={<SimilarView />} />}
      {<Route path="/faces/:id/:faceIndex" element={<FacesView />} />}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
