// scripts/generate-aws-exports.js
const fs = require("fs");
const path = require("path");

const config = `const awsConfig = {
  aws_project_region: '${process.env.REACT_APP_AWS_REGION}',
  aws_appsync_graphqlEndpoint: '${process.env.REACT_APP_APPSYNC_ENDPOINT}',
  aws_appsync_region: '${process.env.REACT_APP_AWS_REGION}',
  aws_appsync_authenticationType: 'API_KEY',
  aws_appsync_apiKey: '${process.env.REACT_APP_APPSYNC_API_KEY}',
};

export default awsConfig;
`;

fs.writeFileSync(path.join(__dirname, "../src/aws-exports.js"), config);
console.log("Generated aws-exports.js from environment variables");
