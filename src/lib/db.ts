import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Database = NeonHttpDatabase<typeof schema>;

let cachedDb: Database | null = null;

export function getDb(): Database {
  if (cachedDb) return cachedDb;

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const sql = neon(process.env.DATABASE_URL);
  cachedDb = drizzle(sql, { schema });

  return cachedDb;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const database = getDb();
    const value = Reflect.get(database, prop, receiver);

    return typeof value === 'function' ? value.bind(database) : value;
  },
});
