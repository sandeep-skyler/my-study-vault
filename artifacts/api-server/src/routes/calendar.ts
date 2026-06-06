import { Router } from "express";
import { db, calendarEventsTable, subjectsTable } from "@workspace/db";
import { eq, and, gte, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const fmt = (e: typeof calendarEventsTable.$inferSelect, subjectName?: string | null) => ({
  ...e,
  subjectId: e.subjectId ?? null,
  subjectName: subjectName ?? null,
  date: e.date.toISOString(),
  createdAt: e.createdAt.toISOString(),
});

async function enrichWithSubject(events: (typeof calendarEventsTable.$inferSelect)[], userId: string) {
  const subjectIds = [...new Set(events.map((e) => e.subjectId).filter(Boolean))] as number[];
  const subjects = subjectIds.length > 0
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.userId, userId))
    : [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  return events.map((e) => fmt(e, e.subjectId ? subjectMap.get(e.subjectId) : null));
}

router.get("/calendar/events", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const rows = await db.select().from(calendarEventsTable).where(eq(calendarEventsTable.userId, userId)).orderBy(asc(calendarEventsTable.date));
  res.json(await enrichWithSubject(rows, userId));
});

router.post("/calendar/events", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { title, description, date, eventType, subjectId } = req.body;
  if (!title || !date || !eventType) { res.status(400).json({ error: "title, date, eventType required" }); return; }
  const [row] = await db.insert(calendarEventsTable).values({ userId, title, description, date: new Date(date), eventType, subjectId: subjectId ?? null }).returning();
  res.status(201).json(fmt(row));
});

router.patch("/calendar/events/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  const { title, description, date, eventType, subjectId } = req.body;
  const [row] = await db.update(calendarEventsTable).set({ ...(title && { title }), ...(description !== undefined && { description }), ...(date && { date: new Date(date) }), ...(eventType && { eventType }), ...(subjectId !== undefined && { subjectId }) }).where(and(eq(calendarEventsTable.id, id), eq(calendarEventsTable.userId, userId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(row));
});

router.delete("/calendar/events/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = Number(req.params.id);
  await db.delete(calendarEventsTable).where(and(eq(calendarEventsTable.id, id), eq(calendarEventsTable.userId, userId)));
  res.status(204).send();
});

router.get("/calendar/upcoming", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const now = new Date();
  const rows = await db.select().from(calendarEventsTable).where(and(eq(calendarEventsTable.userId, userId), gte(calendarEventsTable.date, now))).orderBy(asc(calendarEventsTable.date));
  const upcoming = rows.slice(0, 5);
  res.json(await enrichWithSubject(upcoming, userId));
});

router.get("/calendar/next-exam", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const now = new Date();
  const rows = await db.select().from(calendarEventsTable).where(and(eq(calendarEventsTable.userId, userId), gte(calendarEventsTable.date, now), eq(calendarEventsTable.eventType, "exam"))).orderBy(asc(calendarEventsTable.date));
  if (!rows.length) { res.json({ event: null, daysRemaining: null }); return; }
  const exam = rows[0];
  const daysRemaining = Math.ceil((exam.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const enriched = await enrichWithSubject([exam], userId);
  res.json({ event: enriched[0], daysRemaining });
});

export default router;
