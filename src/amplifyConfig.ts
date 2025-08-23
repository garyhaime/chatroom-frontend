import { Amplify } from "aws-amplify";

const awsConfig = {
  aws_project_region: import.meta.env.VITE_AWS_REGION,
  aws_appsync_graphqlEndpoint: import.meta.env.VITE_APPSYNC_ENDPOINT,
  aws_appsync_region: import.meta.env.VITE_AWS_REGION,
  aws_appsync_authenticationType: "API_KEY",
  aws_appsync_apiKey: import.meta.env.VITE_APPSYNC_API_KEY,
};

console.log("Environment variables:", {
  region: import.meta.env.VITE_AWS_REGION,
  endpoint: import.meta.env.VITE_APPSYNC_ENDPOINT,
  apiKey: import.meta.env.VITE_APPSYNC_API_KEY ? "SET" : "MISSING",
});

Amplify.configure(awsConfig);

export { Amplify };
