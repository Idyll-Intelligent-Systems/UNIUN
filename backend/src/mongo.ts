import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/uniun';
let client: MongoClient | null = null;

export async function connectMongo() {
  client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB');
}

export function getMongoClient() {
  if (!client) throw new Error('Mongo client not connected');
  return client;
}

export async function disconnectMongo() {
  if (client) {
    await client.close();
    client = null
  }
}
