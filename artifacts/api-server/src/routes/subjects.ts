import { Router } from "express";
import { db, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/subjects", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const rows = await db.select().from(subjectsTable).where(eq(subjectsTable.userId, userId));
  res.json(rows.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })));
});

router.post("/subjects", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { name, description, color } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await db.insert(subjectsTable).values({ userId, name, description, color: color ?? "#6366f1" }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/subjects/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const [row] = await db.select().from(subjectsTable).where(and(eq(subjectsTable.id, id), eq(subjectsTable.userId, userId)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/subjects/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const { name, description, color } = req.body;
  const [row] = await db.update(subjectsTable).set({ ...(name && { name }), ...(description !== undefined && { description }), ...(color && { color }) }).where(and(eq(subjectsTable.id, id), eq(subjectsTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/subjects/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(subjectsTable).where(and(eq(subjectsTable.id, id), eq(subjectsTable.userId, userId)));
  res.status(204).send();
});

export default router;
