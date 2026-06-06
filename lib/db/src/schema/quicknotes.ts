import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quickNotesTable = pgTable("quick_notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  color: text("color").notNull().default("#fef08a"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQuickNoteSchema = createInsertSchema(quickNotesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuickNote = z.infer<typeof insertQuickNoteSchema>;
export type QuickNote = typeof quickNotesTable.$inferSelect;
