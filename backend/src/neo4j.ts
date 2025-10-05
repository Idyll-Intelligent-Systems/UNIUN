import neo4j from 'neo4j-driver';

let driver: any = null;

export async function connectNeo4j() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'neo4jpassword';
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  await driver.verifyConnectivity();
  console.log('Connected to Neo4j');
}

export function getNeo4jDriver() {
  if (!driver) throw new Error('Neo4j driver not connected');
  return driver;
}
