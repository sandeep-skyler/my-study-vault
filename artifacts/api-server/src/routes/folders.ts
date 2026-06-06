import { Router } from "express";
import { db, foldersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/topics/:topicId/folders", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const rows = await db.select().from(foldersTable).where(and(eq(foldersTable.topicId, topicId), eq(foldersTable.userId, userId)));
  res.json(rows.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })));
});

router.post("/topics/:topicId/folders", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await db.insert(foldersTable).values({ userId, topicId, name }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/folders/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(foldersTable).where(and(eq(foldersTable.id, id), eq(foldersTable.userId, userId)));
  res.status(204).send();
});

export default router;
