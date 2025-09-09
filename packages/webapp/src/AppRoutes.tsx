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
import { Folders } from './folders/Folders';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AllView />} />
      <Route path="/years" element={<Years />} />
      <Route path="/years/:year" element={<YearView />} />
      <Route path="/view/:id" element={<MediaView />} />
      <Route path="/similar/:id" element={<SimilarView />} />
      <Route path="/search/:term" element={<SearchView />} />
      <Route path="/faces/:id/:faceIndex" element={<FacesView />} />
      <Route path="/tags" element={<Tags />} />
      <Route path="/map" element={<Map />} />
      <Route path="/folders" element={<Folders />} />  {/* <-- new */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

