import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { topicsTable } from "./topics";

export const formulasTable = pgTable("formulas", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  topicId: integer("topic_id").notNull().references(() => topicsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  driveShareableLink: text("drive_shareable_link"),
  originalName: text("original_name"),
  fileType: text("file_type"),
  isImportant: boolean("is_important").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFormulaSchema = createInsertSchema(formulasTable).omit({ id: true, createdAt: true });
export type InsertFormula = z.infer<typeof insertFormulaSchema>;
export type Formula = typeof formulasTable.$inferSelect;
