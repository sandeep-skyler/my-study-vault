import { Router } from "express";
import { db, topicsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const fmt = (t: typeof topicsTable.$inferSelect) => ({
  ...t,
  status: t.status ?? "not_started",
  createdAt: t.createdAt.toISOString(),
});

router.get("/subjects/:subjectId/topics", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const subjectId = Number(req.params.subjectId);
  const rows = await db.select().from(topicsTable).where(and(eq(topicsTable.subjectId, subjectId), eq(topicsTable.userId, userId)));
  res.json(rows.map(fmt));
});

router.post("/subjects/:subjectId/topics", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const subjectId = Number(req.params.subjectId);
  const { name, description, status } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await db.insert(topicsTable).values({ userId, subjectId, name, description, status: status || "not_started" }).returning();
  res.status(201).json(fmt(row));
});

router.get("/topics/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const [row] = await db.select().from(topicsTable).where(and(eq(topicsTable.id, id), eq(topicsTable.userId, userId)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.patch("/topics/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const { name, description, status } = req.body;
  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  const [row] = await db.update(topicsTable).set(updates).where(and(eq(topicsTable.id, id), eq(topicsTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/topics/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(topicsTable).where(and(eq(topicsTable.id, id), eq(topicsTable.userId, userId)));
  res.status(204).send();
});

export default router;
