import { getNeo4jDriver } from './neo4j'

export async function runMigrations() {
  try {
    const driver = getNeo4jDriver()
    const session = driver.session()
    // Create uniqueness constraint for User
  await session.executeWrite((tx: any) => tx.run('CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE'))
  await session.executeWrite((tx: any) => tx.run('CREATE INDEX IF NOT EXISTS FOR (p:Post) ON (p.createdAt)'))
    await session.close()
    console.log('Neo4j migrations applied')
  } catch (err) {
    console.warn('Neo4j migrations skipped or failed', err)
  }
}
