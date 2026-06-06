import { Router } from "express";
import { db, topicsTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/subjects/:subjectId/topics", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const subjectId = Number(req.params.subjectId);
  const rows = await db.select().from(topicsTable).where(and(eq(topicsTable.subjectId, subjectId), eq(topicsTable.userId, userId)));
  res.json(rows.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })));
});

router.post("/subjects/:subjectId/topics", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const subjectId = Number(req.params.subjectId);
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await db.insert(topicsTable).values({ userId, subjectId, name, description }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/topics/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const [row] = await db.select().from(topicsTable).where(and(eq(topicsTable.id, id), eq(topicsTable.userId, userId)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/topics/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const { name, description } = req.body;
  const [row] = await db.update(topicsTable).set({ ...(name && { name }), ...(description !== undefined && { description }) }).where(and(eq(topicsTable.id, id), eq(topicsTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/topics/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(topicsTable).where(and(eq(topicsTable.id, id), eq(topicsTable.userId, userId)));
  res.status(204).send();
});

export default router;
