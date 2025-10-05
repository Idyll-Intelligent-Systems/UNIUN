declare module 'neo4j-driver';
declare module 'stripe';

declare namespace NodeJS {
  interface ProcessEnv {
    MONGO_URI?: string
    NEO4J_URI?: string
    NEO4J_USER?: string
    NEO4J_PASSWORD?: string
    JWT_SECRET?: string
    STRIPE_SECRET?: string
  }
}
