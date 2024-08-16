import * as React from "react";
import { createRoot } from 'react-dom/client';
import { Main } from "./Main";

const setVerticalHeight = () => {
  // We execute the same script as before
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setVerticalHeight);
document.addEventListener('DOMContentLoaded', setVerticalHeight);

const container = document.getElementById("app");
const root = createRoot(container!);
root.render(React.createElement(Main));
