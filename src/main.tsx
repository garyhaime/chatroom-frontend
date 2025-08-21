// In src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css"; // We will add styles here later

// --- Start of Amplify Configuration ---
import { Amplify } from "aws-amplify";

import awsConfig from "./aws-exports";

Amplify.configure(awsConfig);
console.log("Amplify config being used: xxx");

-ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
