import { Router } from "express";
import { db, notesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const fmt = (n: typeof notesTable.$inferSelect) => ({
  ...n,
  createdAt: n.createdAt.toISOString(),
  updatedAt: n.updatedAt.toISOString(),
});

router.get("/topics/:topicId/notes", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const rows = await db.select().from(notesTable).where(and(eq(notesTable.topicId, topicId), eq(notesTable.userId, userId)));
  res.json(rows.map(fmt));
});

router.post("/topics/:topicId/notes", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const { title, content } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const [row] = await db.insert(notesTable).values({ userId, topicId, title, content }).returning();
  res.status(201).json(fmt(row));
});

router.get("/notes/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const [row] = await db.select().from(notesTable).where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.patch("/notes/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const { title, content } = req.body;
  const [row] = await db.update(notesTable).set({ ...(title && { title }), ...(content !== undefined && { content }) }).where(and(eq(notesTable.id, id), eq(notesTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/notes/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(notesTable).where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)));
  res.status(204).send();
});

export default router;
