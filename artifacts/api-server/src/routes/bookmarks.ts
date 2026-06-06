import { Router } from "express";
import { db, bookmarksTable, notesTable, formulasTable, filesTable, videosTable, topicsTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function enrichBookmarks(bookmarks: (typeof bookmarksTable.$inferSelect)[]) {
  return Promise.all(bookmarks.map(async (bm) => {
    let subjectName: string | null = null;
    let topicName: string | null = null;
    try {
      if (bm.itemType === "note") {
        const [note] = await db.select().from(notesTable).where(eq(notesTable.id, bm.itemId));
        if (note) {
          const [topic] = await db.select().from(topicsTable).where(eq(topicsTable.id, note.topicId));
          if (topic) {
            topicName = topic.name;
            const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, topic.subjectId));
            if (subject) subjectName = subject.name;
          }
        }
      } else if (bm.itemType === "formula") {
        const [formula] = await db.select().from(formulasTable).where(eq(formulasTable.id, bm.itemId));
        if (formula) {
          const [topic] = await db.select().from(topicsTable).where(eq(topicsTable.id, formula.topicId));
          if (topic) {
            topicName = topic.name;
            const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, topic.subjectId));
            if (subject) subjectName = subject.name;
          }
        }
      }
    } catch (_) {}
    return { ...bm, subjectName, topicName, createdAt: bm.createdAt.toISOString() };
  }));
}

router.get("/bookmarks", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const rows = await db.select().from(bookmarksTable).where(eq(bookmarksTable.userId, userId));
  res.json(await enrichBookmarks(rows));
});

router.post("/bookmarks", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { itemType, itemId, title } = req.body;
  if (!itemType || !itemId || !title) { res.status(400).json({ error: "itemType, itemId, title required" }); return; }
  const [row] = await db.insert(bookmarksTable).values({ userId, itemType, itemId, title }).returning();
  const enriched = await enrichBookmarks([row]);
  res.status(201).json(enriched[0]);
});

router.delete("/bookmarks/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(bookmarksTable).where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, userId)));
  res.status(204).send();
});

export default router;
