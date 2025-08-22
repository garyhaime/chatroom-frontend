// src/amplifyConfig.ts
import { Amplify } from "aws-amplify";

// Configure Amplify
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNC_ENDPOINT,
      region: import.meta.env.VITE_AWS_REGION,
      defaultAuthMode: "apiKey",
      apiKey: import.meta.env.VITE_APPSYNC_API_KEY,
    },
  },
});

export { Amplify };
