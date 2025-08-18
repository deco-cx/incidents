/**
 * This file is used to define the schema for the database.
 * 
 * After making changes to this file, run `npm run db:generate` to generate the migration file.
 * Then, by just using the app, the migration is lazily ensured at runtime.
 */
import { integer, sqliteTable, text } from "@deco/workers-runtime/drizzle";

export const todosTable = sqliteTable("todos", {
  id: integer("id").primaryKey(),
  title: text("title"),
  completed: integer("completed").default(0),
});

// Incidents system table with JSON columns
export const incidentsTable = sqliteTable("incidents", {
  id: text("id").primaryKey(), // UUID
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull(),
  title: text("title").notNull(),
  status: text("status").notNull(), // INVESTIGATING | IDENTIFIED | MONITORING | RESOLVED
  visibility: text("visibility").notNull().default("private"), // public | private
  commitments: text("commitments"), // Optional commitments text
  createdBy: text("created_by").notNull(), // User ID who created the incident
  // JSON columns for complex data
  affectedResources: text("affected_resources", { mode: "json" }), // Array<{ resource: string, severity: string }>
  timeline: text("timeline", { mode: "json" }), // Array<{ time: Date, event: string, attachmentUrl?: string, createdBy: string }>
});
