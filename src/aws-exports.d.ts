// src/aws-exports.d.ts
declare const awsConfig: {
  aws_project_region: string;
  aws_appsync_graphqlEndpoint: string;
  aws_appsync_region: string;
  aws_appsync_authenticationType: string;
  aws_appsync_apiKey?: string;
};

console.log("AWS Config:", awsConfig);
console.log("AppSync Endpoint:", awsConfig.aws_appsync_graphqlEndpoint);

export default awsConfig;
