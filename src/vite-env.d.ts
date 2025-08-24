interface ImportMetaEnv {
  readonly VITE_APPSYNC_ENDPOINT: string;
  readonly VITE_APPSYNC_API_KEY: string;
  readonly VITE_AWS_REGION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}