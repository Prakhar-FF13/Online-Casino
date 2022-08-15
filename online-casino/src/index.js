import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoulleteGame from "./sections/RoulleteWheel/RoulleteGame";
import WarGame from "./sections/WarGame/WarGame";
import { ReactNotifications } from "react-notifications-component";

ReactDOM.render(
  <>
    <ReactNotifications />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/wargame" element={<WarGame />} />
        <Route path="/roulette" element={<RoulleteGame />} />
      </Routes>
    </BrowserRouter>
  </>,
  document.getElementById("root")
);
