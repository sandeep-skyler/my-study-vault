import { Router } from "express";
import { db, subjectsTable, topicsTable, notesTable, videosTable, formulasTable, todosTable, quickNotesTable, subjectsTable as st } from "@workspace/db";
import { eq, count, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const [subjects, topics, notes, videos, formulas, todos] = await Promise.all([
    db.select({ count: count() }).from(subjectsTable).where(eq(subjectsTable.userId, userId)),
    db.select({ count: count() }).from(topicsTable).where(eq(topicsTable.userId, userId)),
    db.select({ count: count() }).from(notesTable).where(eq(notesTable.userId, userId)),
    db.select({ count: count() }).from(videosTable).where(eq(videosTable.userId, userId)),
    db.select({ count: count() }).from(formulasTable).where(and(eq(formulasTable.userId, userId), eq(formulasTable.isImportant, true))),
    db.select({ count: count() }).from(todosTable).where(and(eq(todosTable.userId, userId), eq(todosTable.completed, false))),
  ]);
  res.json({
    subjectCount: Number(subjects[0].count),
    topicCount: Number(topics[0].count),
    noteCount: Number(notes[0].count),
    videoCount: Number(videos[0].count),
    keyFormulaCount: Number(formulas[0].count),
    pendingTodoCount: Number(todos[0].count),
  });
});

router.get("/dashboard/important-formulas", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const rows = await db.select().from(formulasTable).where(and(eq(formulasTable.userId, userId), eq(formulasTable.isImportant, true)));
  res.json(rows.map((f) => ({ ...f, createdAt: f.createdAt.toISOString(), subjectName: null, topicName: null })));
});

router.get("/dashboard/pending-todos", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const rows = await db.select().from(todosTable).where(and(eq(todosTable.userId, userId), eq(todosTable.completed, false)));
  const top5 = rows.slice(0, 5);
  const subjectIds = [...new Set(top5.map((t) => t.subjectId).filter(Boolean))] as number[];
  const subjects = subjectIds.length > 0
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.userId, userId))
    : [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  res.json(top5.map((t) => ({
    ...t,
    subjectName: t.subjectId ? (subjectMap.get(t.subjectId) ?? null) : null,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  })));
});

router.get("/dashboard/recent-quick-notes", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const rows = await db.select().from(quickNotesTable).where(eq(quickNotesTable.userId, userId)).orderBy(desc(quickNotesTable.updatedAt));
  const recent = rows.slice(0, 3);
  res.json(recent.map((n) => ({ ...n, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() })));
});

export default router;
