import { Router } from "express";
import { db, quickNotesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const fmt = (n: typeof quickNotesTable.$inferSelect) => ({
  ...n,
  createdAt: n.createdAt.toISOString(),
  updatedAt: n.updatedAt.toISOString(),
});

router.get("/quick-notes", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const rows = await db.select().from(quickNotesTable).where(eq(quickNotesTable.userId, userId)).orderBy(desc(quickNotesTable.updatedAt));
  res.json(rows.map(fmt));
});

router.post("/quick-notes", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { title, content, color } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const [row] = await db.insert(quickNotesTable).values({ userId, title, content, color: color ?? "#fef08a" }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/quick-notes/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const { title, content, color } = req.body;
  const [row] = await db.update(quickNotesTable).set({ ...(title && { title }), ...(content !== undefined && { content }), ...(color && { color }) }).where(and(eq(quickNotesTable.id, id), eq(quickNotesTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/quick-notes/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(quickNotesTable).where(and(eq(quickNotesTable.id, id), eq(quickNotesTable.userId, userId)));
  res.status(204).send();
});

export default router;
