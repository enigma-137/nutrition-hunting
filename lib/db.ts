import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

interface GlobalWithMongo extends Global {
  _mongoClientPromise?: Promise<MongoClient>;
}

if (process.env.NODE_ENV === 'development') {
  if (!(global as GlobalWithMongo)._mongoClientPromise) {
    client = new MongoClient(uri);
    (global as GlobalWithMongo)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as GlobalWithMongo)._mongoClientPromise!;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function connectToDatabase(): Promise<MongoClient> {
  return await clientPromise;
}