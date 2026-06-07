import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useGetTopic,
  useGetSubject,
  useUpdateTopic,
  getGetTopicQueryKey,
  useListNotes, useCreateNote, useUpdateNote, useDeleteNote, getListNotesQueryKey,
  useListFormulas, useCreateFormula, useUpdateFormula, useDeleteFormula, useToggleFormulaStar, getListFormulasQueryKey,
  useGetTopicFiles, useUploadFile, useDeleteFile, getGetTopicFilesQueryKey,
  useListVideos, useCreateVideo, useUpdateVideo, useDeleteVideo, getListVideosQueryKey,
  useCreateBookmark, useDeleteBookmark, useListBookmarks, getListBookmarksQueryKey,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Plus, Edit2, Trash2, ChevronRight, BookOpen, FileText, FunctionSquare,
  FileIcon, Video, Star, Bookmark, ExternalLink, BookmarkMinus,
  CheckCircle2, Circle, Clock, Download, X, Tag,
} from "lucide-react";
import { Link, useParams, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type Status = "not_started" | "in_progress" | "completed";
const STATUS_OPTIONS: { value: Status; label: string; icon: React.ElementType; cls: string }[] = [
  { value: "not_started", label: "Not Started", icon: Circle, cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  { value: "in_progress", label: "In Progress", icon: Clock, cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "completed", label: "Completed", icon: CheckCircle2, cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
];

type FormulaForm = { id: number; title: string; content: string; driveShareableLink: string; originalName: string; fileType: string; };
const emptyFormulaForm = (): FormulaForm => ({ id: 0, title: "", content: "", driveShareableLink: "", originalName: "", fileType: "" });

const TAG_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
];
const tagColor = (tag: string) => TAG_COLORS[Math.abs(tag.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % TAG_COLORS.length];

function TagPill({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${tagColor(tag)}`}>
      {tag}
      {onRemove && <button type="button" onClick={onRemove} className="hover:opacity-70"><X className="w-3 h-3" /></button>}
    </span>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };
  return (
    <div className="space-y-2">
      <Label>Tags <span className="text-muted-foreground text-xs">(optional)</span></Label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map(t => <TagPill key={t} tag={t} onRemove={() => onChange(tags.filter(x => x !== t))} />)}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Type a tag, press Enter"
          className="h-8 text-sm"
        />
        <Button type="button" variant="outline" size="sm" className="h-8 px-3" onClick={add}><Tag className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}

export default function TopicDetail() {
  const params = useParams();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialTab = searchParams.get("tab") || "notes";
  const topicId = parseInt(params.id || "0");
  const [activeTab, setActiveTab] = useState(initialTab);
  const queryClient = useQueryClient();

  const { data: topic, isLoading: isTopicLoading } = useGetTopic(topicId, { query: { enabled: !!topicId } as any });
  const { data: subject } = useGetSubject(topic?.subjectId || 0, { query: { enabled: !!topic?.subjectId } as any });
  const { data: notes } = useListNotes(topicId, { query: { enabled: !!topicId } as any });
  const { data: formulas } = useListFormulas(topicId, { query: { enabled: !!topicId } as any });
  const { data: files } = useGetTopicFiles(topicId, { query: { enabled: !!topicId } as any });
  const { data: videos } = useListVideos(topicId, { query: { enabled: !!topicId } as any });
  const { data: bookmarks } = useListBookmarks();

  const updateTopic = useUpdateTopic();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const createFormula = useCreateFormula();
  const updateFormula = useUpdateFormula();
  const deleteFormula = useDeleteFormula();
  const toggleStar = useToggleFormulaStar();
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();
  const deleteVideo = useDeleteVideo();
  const createBookmark = useCreateBookmark();
  const removeBookmark = useDeleteBookmark();

  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [notePreview, setNotePreview] = useState(false);
  const [noteForm, setNoteForm] = useState({ id: 0, title: "", content: "", tags: [] as string[] });
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [formulaForm, setFormulaForm] = useState<FormulaForm>(emptyFormulaForm());

  const [isFileOpen, setIsFileOpen] = useState(false);
  const [fileForm, setFileForm] = useState({ title: "", driveShareableLink: "", originalName: "", fileType: "pdf" });

  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoForm, setVideoForm] = useState({ id: 0, title: "", url: "", description: "" });

  const inv = {
    notes: () => queryClient.invalidateQueries({ queryKey: getListNotesQueryKey(topicId) }),
    formulas: () => queryClient.invalidateQueries({ queryKey: getListFormulasQueryKey(topicId) }),
    files: () => queryClient.invalidateQueries({ queryKey: getGetTopicFilesQueryKey(topicId) }),
    videos: () => queryClient.invalidateQueries({ queryKey: getListVideosQueryKey(topicId) }),
    bookmarks: () => queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() }),
    topic: () => queryClient.invalidateQueries({ queryKey: getGetTopicQueryKey(topicId) }),
  };

  const isBookmarked = (type: string, id: number) => bookmarks?.some(b => b.itemType === type && b.itemId === id) || false;
  const getBookmarkId = (type: string, id: number) => bookmarks?.find(b => b.itemType === type && b.itemId === id)?.id;
  const handleToggleBookmark = (type: "note" | "formula" | "file" | "video", id: number, title: string) => {
    const existingId = getBookmarkId(type, id);
    if (existingId) { removeBookmark.mutate({ id: existingId }, { onSuccess: inv.bookmarks }); }
    else { createBookmark.mutate({ data: { itemType: type, itemId: id, title } }, { onSuccess: inv.bookmarks }); }
  };

  const handleStatusChange = (status: Status) => {
    updateTopic.mutate({ id: topicId, data: { status } }, { onSuccess: inv.topic });
  };

  // PDF export
  const exportPdf = () => {
    if (!notes?.length || !topic) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${topic.name} — Notes</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111}
  h1{font-size:22px;margin-bottom:4px}
  .sub{color:#666;font-size:13px;margin-bottom:32px}
  .note{page-break-inside:avoid;margin-bottom:28px;border:1px solid #e5e7eb;border-radius:8px;padding:20px}
  .note-title{font-size:16px;font-weight:700;margin-bottom:6px}
  .note-date{font-size:11px;color:#9ca3af;margin-bottom:10px}
  .note-body{font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7}
  .tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
  .tag{font-size:11px;background:#f3f4f6;padding:2px 8px;border-radius:12px}
  @media print{body{margin:0}}
</style></head><body>
<h1>${topic.name}</h1>
<div class="sub">${notes.length} note${notes.length !== 1 ? "s" : ""} · Exported ${new Date().toLocaleDateString()}</div>
${notes.map(n => `<div class="note">
  <div class="note-title">${n.title.replace(/</g,"&lt;")}</div>
  <div class="note-date">${format(new Date(n.updatedAt || n.createdAt), "MMM d, yyyy")}</div>
  <div class="note-body">${(n.content || "").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
  ${((n as any).tags as string[])?.length ? `<div class="tags">${((n as any).tags as string[]).map((t: string) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
</div>`).join("")}
</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  if (isTopicLoading || !topic) return <div className="p-8 text-muted-foreground">Loading topic details…</div>;

  const currentStatus = ((topic as any).status || "not_started") as Status;
  const statusCfg = STATUS_OPTIONS.find(s => s.value === currentStatus) ?? STATUS_OPTIONS[0];
  const StatusIcon = statusCfg.icon;

  // Collect all unique tags from notes
  const allTags = Array.from(new Set((notes ?? []).flatMap(n => (n as any).tags as string[] ?? [])));
  const filteredNotes = tagFilter ? (notes ?? []).filter(n => ((n as any).tags as string[] ?? []).includes(tagFilter)) : (notes ?? []);

  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/subjects" className="hover:text-foreground hover:underline transition-colors flex items-center gap-1">
          <BookOpen className="w-4 h-4" /> Subjects
        </Link>
        <ChevronRight className="w-4 h-4" />
        {subject && (
          <>
            <Link href={`/subjects/${subject.id}`} className="hover:text-foreground hover:underline transition-colors flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: subject.color }} />
              {subject.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span className="text-foreground font-medium">{topic.name}</span>
      </div>

      {/* Header row: title + status */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <PageHeader title={topic.name} description={topic.description || ""} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border mt-2 ${statusCfg.cls} hover:opacity-80 transition-opacity`}>
              <StatusIcon className="w-4 h-4" />
              {statusCfg.label}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {STATUS_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <DropdownMenuItem key={opt.value} onClick={() => handleStatusChange(opt.value)} className="gap-2">
                  <Icon className="w-4 h-4" /> {opt.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-card border border-border h-12 w-full justify-start p-1 overflow-x-auto flex-nowrap">
          <TabsTrigger value="notes" className="gap-2 px-4 py-2 data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-600">
            <FileText className="w-4 h-4" /> Notes
          </TabsTrigger>
          <TabsTrigger value="formulas" className="gap-2 px-4 py-2 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600">
            <FunctionSquare className="w-4 h-4" /> Formulas
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2 px-4 py-2 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600">
            <FileIcon className="w-4 h-4" /> Files
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2 px-4 py-2 data-[state=active]:bg-fuchsia-500/10 data-[state=active]:text-fuchsia-600">
            <Video className="w-4 h-4" /> Videos
          </TabsTrigger>
        </TabsList>

        {/* ── NOTES ─────────────────────────────────────────────── */}
        <TabsContent value="notes" className="space-y-4 outline-none">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 className="text-lg font-bold">Class Notes</h3>
            <div className="flex items-center gap-2">
              {notes && notes.length > 0 && (
                <Button size="sm" variant="outline" onClick={exportPdf} className="gap-1.5 text-muted-foreground hover:text-foreground">
                  <Download className="w-4 h-4" /> Export PDF
                </Button>
              )}
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => { setNoteForm({ id: 0, title: "", content: "", tags: [] }); setNotePreview(false); setIsNoteOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Note
              </Button>
            </div>
          </div>

          {/* Tag filter bar */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <button
                onClick={() => setTagFilter(null)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${!tagFilter ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                All
              </button>
              {allTags.map(t => (
                <button
                  key={t}
                  onClick={() => setTagFilter(tagFilter === t ? null : t)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${tagFilter === t ? tagColor(t) + " ring-1 ring-inset ring-current" : tagColor(t) + " opacity-70 hover:opacity-100"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {filteredNotes.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map(note => (
                <Card key={note.id} className="group overflow-hidden border-border flex flex-col">
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight font-bold">{note.title}</CardTitle>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                        {format(new Date(note.updatedAt || note.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleBookmark("note", note.id, note.title)}>
                        {isBookmarked("note", note.id) ? <BookmarkMinus className="w-4 h-4 text-violet-500" /> : <Bookmark className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                        setNoteForm({ id: note.id, title: note.title, content: note.content || "", tags: (note as any).tags ?? [] });
                        setNotePreview(false);
                        setIsNoteOpen(true);
                      }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => {
                        if (confirm("Delete note?")) deleteNote.mutate({ id: note.id }, { onSuccess: inv.notes });
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-2">
                    <div className="text-sm text-muted-foreground line-clamp-4 prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content || ""}</ReactMarkdown>
                    </div>
                    {((note as any).tags as string[])?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {((note as any).tags as string[]).map((t: string) => <TagPill key={t} tag={t} />)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground">
              {tagFilter ? `No notes tagged "${tagFilter}".` : "No notes added yet."}
            </div>
          )}
        </TabsContent>

        {/* ── FORMULAS ──────────────────────────────────────────── */}
        <TabsContent value="formulas" className="space-y-4 outline-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Formulas & Concepts</h3>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { setFormulaForm(emptyFormulaForm()); setIsFormulaOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Formula
            </Button>
          </div>
          {formulas?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formulas.map(f => (
                <div key={f.id} className={`p-4 rounded-xl border relative group flex flex-col gap-3 ${f.isImportant ? "border-amber-400 bg-amber-50/30 dark:bg-amber-900/10" : "bg-card border-border"}`}>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button className="text-amber-500 hover:scale-110 transition-transform" onClick={() => toggleStar.mutate({ id: f.id }, { onSuccess: inv.formulas })}>
                      <Star className={`w-5 h-5 ${f.isImportant ? "fill-amber-500" : ""}`} />
                    </button>
                    <button className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-all" onClick={() => {
                      setFormulaForm({ id: f.id, title: f.title, content: f.content || "", driveShareableLink: f.driveShareableLink || "", originalName: f.originalName || "", fileType: f.fileType || "" });
                      setIsFormulaOpen(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all" onClick={() => {
                      if (confirm("Delete formula?")) deleteFormula.mutate({ id: f.id }, { onSuccess: inv.formulas });
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-foreground pr-20">{f.title}</h4>
                  {f.content && <div className="bg-background border border-border p-3 rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap">{f.content}</div>}
                  {f.driveShareableLink && (
                    <a href={f.driveShareableLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg px-3 py-2">
                      <FileIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{f.originalName || "View File"}</span>
                      {f.fileType && <Badge variant="secondary" className="ml-auto text-[10px] uppercase font-bold flex-shrink-0">{f.fileType}</Badge>}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleBookmark("formula", f.id, f.title)}>
                    {isBookmarked("formula", f.id) ? <BookmarkMinus className="w-4 h-4 text-violet-500" /> : <Bookmark className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground">No formulas added yet.</div>
          )}
        </TabsContent>

        {/* ── FILES ─────────────────────────────────────────────── */}
        <TabsContent value="files" className="space-y-4 outline-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Documents & Files</h3>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setFileForm({ title: "", driveShareableLink: "", originalName: "", fileType: "pdf" }); setIsFileOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Link Drive File
            </Button>
          </div>
          {files?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {files.map(f => (
                <a key={f.id} href={f.driveShareableLink} target="_blank" rel="noreferrer" className="block group">
                  <Card className="hover:border-blue-400 transition-colors bg-card h-full flex flex-col">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                      <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg"><FileIcon className="w-5 h-5" /></div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 z-10" onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        if (confirm("Remove file link?")) deleteFile.mutate({ id: f.id }, { onSuccess: inv.files });
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <h4 className="font-bold text-sm line-clamp-2 leading-tight">{f.title}</h4>
                      {f.originalName && <p className="text-xs text-muted-foreground mt-1 truncate">{f.originalName}</p>}
                      <div className="flex items-center justify-between mt-4">
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">{f.fileType}</Badge>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground">No files linked yet.</div>
          )}
        </TabsContent>

        {/* ── VIDEOS ────────────────────────────────────────────── */}
        <TabsContent value="videos" className="space-y-4 outline-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Video Resources</h3>
            <Button size="sm" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white" onClick={() => { setVideoForm({ id: 0, title: "", url: "", description: "" }); setIsVideoOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Video
            </Button>
          </div>
          {videos?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map(v => (
                <Card key={v.id} className="overflow-hidden border-border bg-card group">
                  <div className="aspect-video bg-muted relative flex items-center justify-center border-b border-border">
                    <Video className="w-10 h-10 text-muted-foreground/30" />
                    <a href={v.url} target="_blank" rel="noreferrer" className="absolute inset-0" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm leading-tight truncate">{v.title}</h4>
                        {v.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</p>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleBookmark("video", v.id, v.title)}>
                          {isBookmarked("video", v.id) ? <BookmarkMinus className="w-4 h-4 text-violet-500" /> : <Bookmark className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setVideoForm({ id: v.id, title: v.title, url: v.url, description: v.description || "" }); setIsVideoOpen(true); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => {
                          if (confirm("Delete video?")) deleteVideo.mutate({ id: v.id }, { onSuccess: inv.videos });
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <a href={v.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
                      <ExternalLink className="w-3 h-3" /> Open video
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground">No videos added yet.</div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── NOTE DIALOG ───────────────────────────────────────── */}
      <Dialog open={isNoteOpen} onOpenChange={(open) => { setIsNoteOpen(open); if (!open) { setNoteForm({ id: 0, title: "", content: "", tags: [] }); setNotePreview(false); } }}>
        <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{noteForm.id ? "Edit Note" : "New Note"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (noteForm.id) {
              updateNote.mutate({ id: noteForm.id, data: { title: noteForm.title, content: noteForm.content, tags: noteForm.tags } }, {
                onSuccess: () => { inv.notes(); setIsNoteOpen(false); }
              });
            } else {
              createNote.mutate({ topicId, data: { title: noteForm.title, content: noteForm.content, tags: noteForm.tags } }, {
                onSuccess: () => { inv.notes(); setIsNoteOpen(false); }
              });
            }
          }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} required placeholder="e.g. Chapter 1 – Newton's Laws" />
            </div>

            {/* Write / Preview tabs */}
            <div>
              <div className="flex gap-1 mb-2">
                <button type="button" onClick={() => setNotePreview(false)} className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${!notePreview ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>Write</button>
                <button type="button" onClick={() => setNotePreview(true)} className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${notePreview ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>Preview</button>
              </div>
              {notePreview ? (
                <div className="min-h-[200px] max-h-[360px] overflow-y-auto p-3 border border-border rounded-lg bg-muted/30 prose prose-sm dark:prose-invert max-w-none text-sm">
                  {noteForm.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{noteForm.content}</ReactMarkdown> : <span className="text-muted-foreground">Nothing to preview yet.</span>}
                </div>
              ) : (
                <Textarea
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder={"# Heading\n\nWrite your notes here. Supports **Markdown** formatting.\n\n- Bullet lists\n- **Bold**, *italic*\n- `code blocks`"}
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">Supports Markdown: **bold**, *italic*, `code`, # headings, - lists</p>
            </div>

            <TagInput tags={noteForm.tags} onChange={(tags) => setNoteForm({ ...noteForm, tags })} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNoteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createNote.isPending || updateNote.isPending}>
                {(createNote.isPending || updateNote.isPending) ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── FORMULA DIALOG ────────────────────────────────────── */}
      <Dialog open={isFormulaOpen} onOpenChange={(open) => { setIsFormulaOpen(open); if (!open) setFormulaForm(emptyFormulaForm()); }}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader><DialogTitle>{formulaForm.id ? "Edit Formula" : "New Formula"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const payload = { title: formulaForm.title, content: formulaForm.content || undefined, driveShareableLink: formulaForm.driveShareableLink || undefined, originalName: formulaForm.originalName || undefined, fileType: formulaForm.fileType || undefined };
            if (formulaForm.id) { updateFormula.mutate({ id: formulaForm.id, data: payload }, { onSuccess: () => { inv.formulas(); setIsFormulaOpen(false); } }); }
            else { createFormula.mutate({ topicId, data: payload }, { onSuccess: () => { inv.formulas(); setIsFormulaOpen(false); } }); }
          }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formulaForm.title} onChange={(e) => setFormulaForm({ ...formulaForm, title: e.target.value })} required placeholder="e.g. Chapter 1 Notes" />
            </div>
            <div className="space-y-2">
              <Label>Notes / Content <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea value={formulaForm.content} onChange={(e) => setFormulaForm({ ...formulaForm, content: e.target.value })} rows={4} className="font-mono" placeholder="F = ma, or any formula / concept…" />
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Attach a Drive File <span className="text-xs">(optional)</span></p>
              <div className="space-y-2">
                <Label>Drive Shareable Link</Label>
                <Input value={formulaForm.driveShareableLink} onChange={(e) => setFormulaForm({ ...formulaForm, driveShareableLink: e.target.value })} placeholder="https://drive.google.com/file/d/…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Original Filename</Label>
                  <Input value={formulaForm.originalName} onChange={(e) => setFormulaForm({ ...formulaForm, originalName: e.target.value })} placeholder="document.pdf" />
                </div>
                <div className="space-y-2">
                  <Label>File Type</Label>
                  <Select value={formulaForm.fileType || "pdf"} onValueChange={(val) => setFormulaForm({ ...formulaForm, fileType: val })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormulaOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createFormula.isPending || updateFormula.isPending}>
                {(createFormula.isPending || updateFormula.isPending) ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── FILE DIALOG ───────────────────────────────────────── */}
      <Dialog open={isFileOpen} onOpenChange={(open) => { setIsFileOpen(open); if (!open) setFileForm({ title: "", driveShareableLink: "", originalName: "", fileType: "pdf" }); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Link File from Google Drive</DialogTitle></DialogHeader>
          <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-900 mb-2">
            Upload to Google Drive first, then paste the shareable link.
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            uploadFile.mutate({ topicId, data: { title: fileForm.title, driveShareableLink: fileForm.driveShareableLink, driveFileId: "manual", originalName: fileForm.originalName || fileForm.title, mimeType: fileForm.fileType, fileType: fileForm.fileType } }, {
              onSuccess: () => { inv.files(); setIsFileOpen(false); }
            });
          }} className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={fileForm.title} onChange={(e) => setFileForm({ ...fileForm, title: e.target.value })} placeholder="e.g. Chapter 1 Notes" required /></div>
            <div className="space-y-2"><Label>Drive Shareable Link</Label><Input value={fileForm.driveShareableLink} onChange={(e) => setFileForm({ ...fileForm, driveShareableLink: e.target.value })} placeholder="https://drive.google.com/file/d/…" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Original Filename</Label><Input value={fileForm.originalName} onChange={(e) => setFileForm({ ...fileForm, originalName: e.target.value })} placeholder="document.pdf" /></div>
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select value={fileForm.fileType} onValueChange={(val) => setFileForm({ ...fileForm, fileType: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFileOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={uploadFile.isPending}>{uploadFile.isPending ? "Linking…" : "Link File"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── VIDEO DIALOG ──────────────────────────────────────── */}
      <Dialog open={isVideoOpen} onOpenChange={(open) => { setIsVideoOpen(open); if (!open) setVideoForm({ id: 0, title: "", url: "", description: "" }); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{videoForm.id ? "Edit Video" : "New Video"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (videoForm.id) { updateVideo.mutate({ id: videoForm.id, data: { title: videoForm.title, url: videoForm.url, description: videoForm.description } }, { onSuccess: () => { inv.videos(); setIsVideoOpen(false); } }); }
            else { createVideo.mutate({ topicId, data: { title: videoForm.title, url: videoForm.url, description: videoForm.description } }, { onSuccess: () => { inv.videos(); setIsVideoOpen(false); } }); }
          }} className="space-y-4 py-4">
            <div className="space-y-2"><Label>Video Title</Label><Input value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} required placeholder="e.g. Lecture 3 – Integration" /></div>
            <div className="space-y-2"><Label>URL (YouTube, Drive, etc.)</Label><Input value={videoForm.url} onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })} type="url" required placeholder="https://youtube.com/…" /></div>
            <div className="space-y-2"><Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label><Textarea value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsVideoOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createVideo.isPending || updateVideo.isPending}>{(createVideo.isPending || updateVideo.isPending) ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
