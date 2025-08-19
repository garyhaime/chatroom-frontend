import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = `const awsConfig = {
  aws_project_region: '${process.env.REACT_APP_AWS_REGION || ""}',
  aws_appsync_graphqlEndpoint: '${
    process.env.REACT_APP_APPSYNC_ENDPOINT || ""
  }',
  aws_appsync_region: '${process.env.REACT_APP_AWS_REGION || ""}',
  aws_appsync_authenticationType: 'API_KEY',
  aws_appsync_apiKey: '${process.env.REACT_APP_APPSYNC_API_KEY || ""}',
};

export default awsConfig;
`;

// Write to src/aws-exports.js
fs.writeFileSync(path.join(__dirname, "../src/aws-exports.js"), config);
console.log("Generated aws-exports.js from environment variables");
