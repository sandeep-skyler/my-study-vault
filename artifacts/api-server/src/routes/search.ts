import { Router } from "express";
import { db, notesTable, formulasTable, filesTable, videosTable, topicsTable, subjectsTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/search", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) { res.json({ results: [] }); return; }

  const pattern = `%${q}%`;

  const [notes, formulas, files, videos] = await Promise.all([
    db.select().from(notesTable).where(and(eq(notesTable.userId, userId), ilike(notesTable.title, pattern))),
    db.select().from(formulasTable).where(and(eq(formulasTable.userId, userId), ilike(formulasTable.title, pattern))),
    db.select().from(filesTable).where(and(eq(filesTable.userId, userId), ilike(filesTable.title, pattern))),
    db.select().from(videosTable).where(and(eq(videosTable.userId, userId), ilike(videosTable.title, pattern))),
  ]);

  const topicIds = [...new Set([
    ...notes.map((n) => n.topicId),
    ...formulas.map((f) => f.topicId),
    ...files.map((f) => f.topicId),
    ...videos.map((v) => v.topicId),
  ])];

  const topics = topicIds.length > 0
    ? await db.select().from(topicsTable).where(eq(topicsTable.userId, userId))
    : [];
  const topicMap = new Map(topics.map((t) => [t.id, t]));

  const subjectIds = [...new Set(topics.map((t) => t.subjectId))];
  const subjects = subjectIds.length > 0
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.userId, userId))
    : [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  const results = [
    ...notes.map((n) => {
      const topic = topicMap.get(n.topicId);
      return { type: "note", id: n.id, title: n.title, topicId: n.topicId, topicName: topic?.name ?? null, subjectName: topic ? (subjectMap.get(topic.subjectId) ?? null) : null };
    }),
    ...formulas.map((f) => {
      const topic = topicMap.get(f.topicId);
      return { type: "formula", id: f.id, title: f.title, topicId: f.topicId, topicName: topic?.name ?? null, subjectName: topic ? (subjectMap.get(topic.subjectId) ?? null) : null };
    }),
    ...files.map((f) => {
      const topic = topicMap.get(f.topicId);
      return { type: "file", id: f.id, title: f.title, topicId: f.topicId, topicName: topic?.name ?? null, subjectName: topic ? (subjectMap.get(topic.subjectId) ?? null) : null };
    }),
    ...videos.map((v) => {
      const topic = topicMap.get(v.topicId);
      return { type: "video", id: v.id, title: v.title, topicId: v.topicId, topicName: topic?.name ?? null, subjectName: topic ? (subjectMap.get(topic.subjectId) ?? null) : null };
    }),
  ];

  res.json({ results });
});

export default router;
