import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { MatchProvider } from "./context/MatchContext";

import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <AuthProvider>

      <MatchProvider>

        <App />

      </MatchProvider>

    </AuthProvider>

  </React.StrictMode>

);