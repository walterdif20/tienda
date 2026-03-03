import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/providers/auth-provider";
import { StoreSettingsProvider } from "@/providers/store-settings-provider";

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
