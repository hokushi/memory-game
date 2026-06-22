import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/infrastructure/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/memory_game",
  },
});
