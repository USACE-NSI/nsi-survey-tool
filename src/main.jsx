import React from "react";
import ReactDOM from "react-dom/client";
import getStore from "./app-bundles";
import { ReduxBundlerProvider } from "redux-bundler-hook";
import App from "./App.jsx";
import "./index.css";

const store = getStore();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ReduxBundlerProvider store={store}>
      <App />
    </ReduxBundlerProvider>
  </React.StrictMode>
);