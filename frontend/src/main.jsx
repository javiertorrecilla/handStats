import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { MatchProvider } from "./context/MatchContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { initErrorTracking } from "./services/errorTrackingService";

import "./i18n/i18n";
import "./index.css";

initErrorTracking();

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <MatchProvider>
              <App />
            </MatchProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);