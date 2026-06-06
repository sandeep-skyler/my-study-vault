import { Router } from "express";
import { db, filesTable, foldersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const fmt = (f: typeof filesTable.$inferSelect) => ({
  ...f,
  folderId: f.folderId ?? null,
  createdAt: f.createdAt.toISOString(),
});

router.get("/topics/:topicId/files", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const rows = await db.select().from(filesTable).where(and(eq(filesTable.topicId, topicId), eq(filesTable.userId, userId)));
  res.json(rows.map(fmt));
});

router.post("/topics/:topicId/files/upload", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const { title, driveFileId, driveShareableLink, originalName, mimeType, fileType, folderId } = req.body;
  if (!title || !driveShareableLink || !originalName) {
    res.status(400).json({ error: "title, driveShareableLink, and originalName required" });
    return;
  }
  const [row] = await db.insert(filesTable).values({
    userId,
    topicId,
    title,
    driveFileId: driveFileId ?? "manual",
    driveShareableLink,
    originalName,
    mimeType: mimeType ?? "application/octet-stream",
    fileType: fileType ?? "other",
    folderId: folderId ?? null,
  }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/files/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const { title, folderId } = req.body;
  const [row] = await db.update(filesTable).set({ ...(title && { title }), ...(folderId !== undefined && { folderId }) }).where(and(eq(filesTable.id, id), eq(filesTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/files/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(filesTable).where(and(eq(filesTable.id, id), eq(filesTable.userId, userId)));
  res.status(204).send();
});

export default router;
