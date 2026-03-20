import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/providers/auth-provider";
import { StoreSettingsProvider } from "@/providers/store-settings-provider";

const APP_LOADER_ID = "app-loader";
const APP_LOADER_HIDDEN_CLASS = "app-loader--hidden";
const APP_LOADER_MIN_VISIBLE_MS = 700;
const appBootStartedAt = Date.now();

function dismissAppLoader() {
  const loader = document.getElementById(APP_LOADER_ID);

  if (!loader || loader.classList.contains(APP_LOADER_HIDDEN_CLASS)) {
    return;
  }

  loader.classList.add(APP_LOADER_HIDDEN_CLASS);
  window.setTimeout(() => loader.remove(), 650);
}

function scheduleAppLoaderDismiss() {
  const elapsedTime = Date.now() - appBootStartedAt;
  const remainingTime = Math.max(APP_LOADER_MIN_VISIBLE_MS - elapsedTime, 0);

  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(dismissAppLoader);
    });
  }, remainingTime);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreSettingsProvider>
          <App />
        </StoreSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

if (document.readyState === "complete") {
  scheduleAppLoaderDismiss();
} else {
  window.addEventListener("load", scheduleAppLoaderDismiss, { once: true });
}
