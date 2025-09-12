import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: { wranglerConfigPath: './wrangler.toml', dbName: process.env.DATABASE || 'noxora' },
  verbose: true,
  strict: true,
});

