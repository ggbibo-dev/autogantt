import pkg from 'pg';
const { Client } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect().catch(console.error);
export const db = drizzle(client, { schema });
