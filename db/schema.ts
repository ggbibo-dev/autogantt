import { pgTable, text, integer, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const epics = pgTable("epics", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull()
});

export const tasks = pgTable("tasks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  epicId: integer("epic_id").references(() => epics.id),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull(),
  dependencies: jsonb("dependencies").$type<string[]>().default([])
});

export const insertEpicSchema = createInsertSchema(epics);
export const selectEpicSchema = createSelectSchema(epics);
export const insertTaskSchema = createInsertSchema(tasks);
export const selectTaskSchema = createSelectSchema(tasks);

export type Epic = z.infer<typeof selectEpicSchema>;
export type Task = z.infer<typeof selectTaskSchema>;

// Task types are kept simple for CSV import functionality

export const jiraSettings = pgTable("jira_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  domain: text("domain").notNull(),
  apiToken: text("api_token").notNull(),
  email: text("email").notNull()
});

export const insertJiraSettingsSchema = createInsertSchema(jiraSettings);
export const selectJiraSettingsSchema = createSelectSchema(jiraSettings);
export type JiraSettings = z.infer<typeof selectJiraSettingsSchema>;


export const editLogs = pgTable("edit_logs", {
  id: serial("id").primaryKey(), // Auto-incrementing primary key
  taskId: integer("task_id").notNull().references(() => tasks.id), // Foreign key to tasks table
  updatedField: text("updated_field").notNull(), // Name of the updated field
  oldValue: text("old_value"), // Previous value of the field
  newValue: text("new_value"), // New value of the field
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Auto timestamp
});

export const insertEditLogSchema = createInsertSchema(editLogs);
export const selectEditLogSchema = createSelectSchema(editLogs);
export type EditLog = z.infer<typeof selectEditLogSchema>;