import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { topicsTable } from "./topics";
import { foldersTable } from "./folders";

export const filesTable = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  topicId: integer("topic_id").notNull().references(() => topicsTable.id, { onDelete: "cascade" }),
  folderId: integer("folder_id").references(() => foldersTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  driveFileId: text("drive_file_id").notNull(),
  driveShareableLink: text("drive_shareable_link").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileType: text("file_type").notNull().default("other"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFileSchema = createInsertSchema(filesTable).omit({ id: true, createdAt: true });
export type InsertFile = z.infer<typeof insertFileSchema>;
export type StudyFile = typeof filesTable.$inferSelect;
