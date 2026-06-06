import { Router } from "express";
import { db, videosTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const fmt = (v: typeof videosTable.$inferSelect) => ({ ...v, createdAt: v.createdAt.toISOString() });

router.get("/topics/:topicId/videos", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const rows = await db.select().from(videosTable).where(and(eq(videosTable.topicId, topicId), eq(videosTable.userId, userId)));
  res.json(rows.map(fmt));
});

router.post("/topics/:topicId/videos", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const { title, description, url, notes } = req.body;
  if (!title || !url) { res.status(400).json({ error: "title and url required" }); return; }
  const [row] = await db.insert(videosTable).values({ userId, topicId, title, description, url, notes }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/videos/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const { title, description, url, notes } = req.body;
  const [row] = await db.update(videosTable).set({ ...(title && { title }), ...(description !== undefined && { description }), ...(url && { url }), ...(notes !== undefined && { notes }) }).where(and(eq(videosTable.id, id), eq(videosTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/videos/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(videosTable).where(and(eq(videosTable.id, id), eq(videosTable.userId, userId)));
  res.status(204).send();
});

export default router;
