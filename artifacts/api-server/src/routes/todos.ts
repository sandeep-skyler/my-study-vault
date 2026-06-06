import { Router } from "express";
import { db, todosTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function enrichWithSubject(todos: (typeof todosTable.$inferSelect)[], userId: string) {
  const subjectIds = [...new Set(todos.map((t) => t.subjectId).filter(Boolean))] as number[];
  const subjects = subjectIds.length > 0
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.userId, userId))
    : [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  return todos.map((t) => ({
    ...t,
    subjectName: t.subjectId ? (subjectMap.get(t.subjectId) ?? null) : null,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }));
}

router.get("/todos", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const rows = await db.select().from(todosTable).where(eq(todosTable.userId, userId));
  res.json(await enrichWithSubject(rows, userId));
});

router.post("/todos", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { text, subjectId, dueDate } = req.body;
  if (!text) { res.status(400).json({ error: "text required" }); return; }
  const [row] = await db.insert(todosTable).values({ userId, text, subjectId: subjectId ?? null, dueDate: dueDate ? new Date(dueDate) : null }).returning();
  const enriched = await enrichWithSubject([row], userId);
  res.status(201).json(enriched[0]);
});

router.patch("/todos/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const { text, subjectId, dueDate, completed } = req.body;
  const [row] = await db.update(todosTable).set({ ...(text && { text }), ...(subjectId !== undefined && { subjectId }), ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }), ...(completed !== undefined && { completed }) }).where(and(eq(todosTable.id, id), eq(todosTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const enriched = await enrichWithSubject([row], userId);
  res.json(enriched[0]);
});

router.delete("/todos/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(todosTable).where(and(eq(todosTable.id, id), eq(todosTable.userId, userId)));
  res.status(204).send();
});

router.patch("/todos/:id/complete", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const [current] = await db.select().from(todosTable).where(and(eq(todosTable.id, id), eq(todosTable.userId, userId)));
  if (!current) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db.update(todosTable).set({ completed: !current.completed }).where(eq(todosTable.id, id)).returning();
  const enriched = await enrichWithSubject([row], userId);
  res.json(enriched[0]);
});

export default router;
