export type Bindings = {
  KV: KVNamespace;
  DB: D1Database;
  R2: R2Bucket;

  // firebase
  FIREBASE_PROJECT_ID: string;
  FIREBASE_JWK_CACHE_KEY: string;
};
