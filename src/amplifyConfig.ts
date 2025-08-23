import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNC_ENDPOINT,
      defaultAuthMode: "apiKey",
      apiKey: import.meta.env.VITE_APPSYNC_API_KEY,
      region: import.meta.env.VITE_AWS_REGION,
    },
  },
});

console.log("Environment variables:", {
  region: import.meta.env.VITE_AWS_REGION,
  endpoint: import.meta.env.VITE_APPSYNC_ENDPOINT,
  apiKey: import.meta.env.VITE_APPSYNC_API_KEY ? "SET" : "MISSING",
});

export const client = generateClient();
