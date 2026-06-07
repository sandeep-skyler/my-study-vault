import { Router } from "express";
import { db, formulasTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const fmt = (f: typeof formulasTable.$inferSelect) => ({
  ...f,
  content: f.content ?? null,
  driveShareableLink: f.driveShareableLink ?? null,
  originalName: f.originalName ?? null,
  fileType: f.fileType ?? null,
  subjectName: null,
  topicName: null,
  createdAt: f.createdAt.toISOString(),
});

router.get("/topics/:topicId/formulas", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const rows = await db.select().from(formulasTable).where(and(eq(formulasTable.topicId, topicId), eq(formulasTable.userId, userId)));
  res.json(rows.map(fmt));
});

router.post("/topics/:topicId/formulas", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const { title, content, driveShareableLink, originalName, fileType } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const [row] = await db.insert(formulasTable).values({
    userId,
    topicId,
    title,
    content: content || null,
    driveShareableLink: driveShareableLink || null,
    originalName: originalName || null,
    fileType: fileType || null,
  }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/formulas/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const { title, content, isImportant, driveShareableLink, originalName, fileType } = req.body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content || null;
  if (isImportant !== undefined) updates.isImportant = isImportant;
  if (driveShareableLink !== undefined) updates.driveShareableLink = driveShareableLink || null;
  if (originalName !== undefined) updates.originalName = originalName || null;
  if (fileType !== undefined) updates.fileType = fileType || null;
  const [row] = await db.update(formulasTable).set(updates).where(and(eq(formulasTable.id, id), eq(formulasTable.userId, userId))).returning();
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
