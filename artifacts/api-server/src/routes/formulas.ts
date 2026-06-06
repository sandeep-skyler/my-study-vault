import { Router } from "express";
import { db, formulasTable, topicsTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const fmt = (f: typeof formulasTable.$inferSelect, subjectName?: string | null, topicName?: string | null) => ({
  ...f,
  subjectName: subjectName ?? null,
  topicName: topicName ?? null,
  createdAt: f.createdAt.toISOString(),
});

router.get("/topics/:topicId/formulas", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const rows = await db.select().from(formulasTable).where(and(eq(formulasTable.topicId, topicId), eq(formulasTable.userId, userId)));
  res.json(rows.map((f) => fmt(f)));
});

router.post("/topics/:topicId/formulas", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const { title, content } = req.body;
  if (!title || !content) { res.status(400).json({ error: "title and content required" }); return; }
  const [row] = await db.insert(formulasTable).values({ userId, topicId, title, content }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/formulas/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const { title, content, isImportant } = req.body;
  const [row] = await db.update(formulasTable).set({ ...(title && { title }), ...(content !== undefined && { content }), ...(isImportant !== undefined && { isImportant }) }).where(and(eq(formulasTable.id, id), eq(formulasTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/formulas/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(formulasTable).where(and(eq(formulasTable.id, id), eq(formulasTable.userId, userId)));
  res.status(204).send();
});

router.patch("/formulas/:id/star", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const [current] = await db.select().from(formulasTable).where(and(eq(formulasTable.id, id), eq(formulasTable.userId, userId)));
  if (!current) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db.update(formulasTable).set({ isImportant: !current.isImportant }).where(eq(formulasTable.id, id)).returning();
  res.json(fmt(row));
});

export default router;
