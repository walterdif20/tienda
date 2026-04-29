import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/providers/auth-provider";
import { StoreSettingsProvider } from "@/providers/store-settings-provider";

const REDIRECT_QUERY_PARAM = "p";

function restoreGithubPagesPath() {
  const url = new URL(window.location.href);
  const encodedPath = url.searchParams.get(REDIRECT_QUERY_PARAM);

  if (!encodedPath) {
    return;
  }

  const restoredPath = decodeURIComponent(encodedPath);
  url.searchParams.delete(REDIRECT_QUERY_PARAM);

  const remainingSearch = url.searchParams.toString();
  const cleanedSearch = remainingSearch ? `?${remainingSearch}` : "";
  const finalUrl = `${restoredPath}${cleanedSearch}`;

  window.history.replaceState(null, "", finalUrl);
}

restoreGithubPagesPath();



const APP_LOADER_ID = "app-loader";
const APP_LOADER_HIDDEN_CLASS = "app-loader--hidden";
const APP_LOADER_MIN_VISIBLE_MS = 700;
const appBootStartedAt = Date.now();

const resolveRouterBasename = () => {
  if (import.meta.env.BASE_URL !== "./") {
    return import.meta.env.BASE_URL;
  }

  if (!window.location.hostname.endsWith("github.io")) {
    return "/";
  }

  const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
  return firstSegment ? `/${firstSegment}` : "/";
};

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




const resolveRootElement = () => {
  const rootNode = document.getElementById("root");

  if (rootNode) {
    return rootNode;
  }

  const fallbackRoot = document.createElement("div");
  fallbackRoot.id = "root";
  document.body.appendChild(fallbackRoot);
  return fallbackRoot;
};

ReactDOM.createRoot(resolveRootElement()).render(
  <React.StrictMode>
    <BrowserRouter basename={resolveRouterBasename()}>
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
