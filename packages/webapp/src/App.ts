import * as React from "react";
import * as ReactDOM from "react-dom";
import { Root } from "./Main";

const setVerticalHeight = () => {
  // We execute the same script as before
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setVerticalHeight);
document.addEventListener('DOMContentLoaded', setVerticalHeight);

const app = document.getElementById("app");

ReactDOM.render(React.createElement(Root), app);
