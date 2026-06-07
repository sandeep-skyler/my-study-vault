import { useState } from "react";
import { 
  useGetTopic, 
  useGetSubject,
  useListNotes, useCreateNote, useUpdateNote, useDeleteNote,
  getListNotesQueryKey,
  useListFormulas, useCreateFormula, useUpdateFormula, useDeleteFormula, useToggleFormulaStar,
  getListFormulasQueryKey,
  useGetTopicFiles, useUploadFile, useDeleteFile,
  getGetTopicFilesQueryKey,
  useListVideos, useCreateVideo, useUpdateVideo, useDeleteVideo,
  getListVideosQueryKey,
  useCreateBookmark, useDeleteBookmark, useListBookmarks,
  getListBookmarksQueryKey,
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
import { Plus, Edit2, Trash2, ChevronRight, BookOpen, FileText, FunctionSquare, FileIcon, Video, Star, Bookmark, ExternalLink, BookmarkMinus } from "lucide-react";
import { Link, useParams, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type FormulaForm = { id: number; title: string; content: string; driveShareableLink: string; originalName: string; fileType: string; };
const emptyFormulaForm = (): FormulaForm => ({ id: 0, title: "", content: "", driveShareableLink: "", originalName: "", fileType: "" });

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
  const [noteForm, setNoteForm] = useState({ id: 0, title: "", content: "" });

  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [formulaForm, setFormulaForm] = useState<FormulaForm>(emptyFormulaForm());

  const [isFileOpen, setIsFileOpen] = useState(false);
  const [fileForm, setFileForm] = useState({ title: "", driveShareableLink: "", originalName: "", fileType: "pdf" });

  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoForm, setVideoForm] = useState({ id: 0, title: "", url: "", description: "" });

  const invalidateNotes = () => queryClient.invalidateQueries({ queryKey: getListNotesQueryKey(topicId) });
  const invalidateFormulas = () => queryClient.invalidateQueries({ queryKey: getListFormulasQueryKey(topicId) });
  const invalidateFiles = () => queryClient.invalidateQueries({ queryKey: getGetTopicFilesQueryKey(topicId) });
  const invalidateVideos = () => queryClient.invalidateQueries({ queryKey: getListVideosQueryKey(topicId) });
  const invalidateBookmarks = () => queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });

  const isBookmarked = (type: string, id: number) => bookmarks?.some(b => b.itemType === type && b.itemId === id) || false;
  const getBookmarkId = (type: string, id: number) => bookmarks?.find(b => b.itemType === type && b.itemId === id)?.id;

  const handleToggleBookmark = (type: "note" | "formula" | "file" | "video", id: number, title: string) => {
    const existingId = getBookmarkId(type, id);
    if (existingId) {
      removeBookmark.mutate({ id: existingId }, { onSuccess: invalidateBookmarks });
    } else {
      createBookmark.mutate({ data: { itemType: type, itemId: id, title } }, { onSuccess: invalidateBookmarks });
    }
  };

  if (isTopicLoading || !topic) return <div className="p-8 text-muted-foreground">Loading topic details…</div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
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

      <PageHeader title={topic.name} description={topic.description || ""} />

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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Class Notes</h3>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => { setNoteForm({ id: 0, title: "", content: "" }); setIsNoteOpen(true); }}
              data-testid="button-add-note"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Note
            </Button>
          </div>

          {notes?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map(note => (
                <Card key={note.id} className="group overflow-hidden border-border flex flex-col" data-testid={`card-note-${note.id}`}>
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base leading-tight font-bold">{note.title}</CardTitle>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                        {format(new Date(note.updatedAt || note.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleBookmark("note", note.id, note.title)}>
                        {isBookmarked("note", note.id) ? <BookmarkMinus className="w-4 h-4 text-violet-500" /> : <Bookmark className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setNoteForm({ id: note.id, title: note.title, content: note.content || "" }); setIsNoteOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => {
                        if (confirm("Delete note?")) deleteNote.mutate({ id: note.id }, { onSuccess: invalidateNotes });
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-1">
                    <div className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground">
              No notes added yet.
            </div>
          )}
        </TabsContent>

        {/* ── FORMULAS ──────────────────────────────────────────── */}
        <TabsContent value="formulas" className="space-y-4 outline-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Formulas & Concepts</h3>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => { setFormulaForm(emptyFormulaForm()); setIsFormulaOpen(true); }}
              data-testid="button-add-formula"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Formula
            </Button>
          </div>

          {formulas?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formulas.map(f => (
                <div key={f.id} className={`p-4 rounded-xl border relative group flex flex-col gap-3 ${f.isImportant ? "border-amber-400 bg-amber-50/30 dark:bg-amber-900/10" : "bg-card border-border"}`} data-testid={`card-formula-${f.id}`}>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button className="text-amber-500 hover:scale-110 transition-transform" onClick={() => toggleStar.mutate({ id: f.id }, { onSuccess: invalidateFormulas })}>
                      <Star className={`w-5 h-5 ${f.isImportant ? "fill-amber-500" : ""}`} />
                    </button>
                    <button className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-all" onClick={() => {
                      setFormulaForm({ id: f.id, title: f.title, content: f.content || "", driveShareableLink: f.driveShareableLink || "", originalName: f.originalName || "", fileType: f.fileType || "" });
                      setIsFormulaOpen(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all" onClick={() => {
                      if (confirm("Delete formula?")) deleteFormula.mutate({ id: f.id }, { onSuccess: invalidateFormulas });
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-foreground pr-20">{f.title}</h4>
                  {f.content && (
                    <div className="bg-background border border-border p-3 rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap">{f.content}</div>
                  )}
                  {f.driveShareableLink && (
                    <a
                      href={f.driveShareableLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline mt-1 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg px-3 py-2"
                    >
                      <FileIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{f.originalName || "View File"}</span>
                      {f.fileType && <Badge variant="secondary" className="ml-auto text-[10px] uppercase font-bold flex-shrink-0">{f.fileType}</Badge>}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  )}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleBookmark("formula", f.id, f.title)}>
                      {isBookmarked("formula", f.id) ? <BookmarkMinus className="w-4 h-4 text-violet-500" /> : <Bookmark className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground">
              No formulas added yet.
            </div>
          )}
        </TabsContent>

        {/* ── FILES ─────────────────────────────────────────────── */}
        <TabsContent value="files" className="space-y-4 outline-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Documents & Files</h3>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => { setFileForm({ title: "", driveShareableLink: "", originalName: "", fileType: "pdf" }); setIsFileOpen(true); }}
              data-testid="button-add-file"
            >
              <Plus className="w-4 h-4 mr-2" /> Link Drive File
            </Button>
          </div>

          {files?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {files.map(f => (
                <a key={f.id} href={f.driveShareableLink} target="_blank" rel="noreferrer" className="block group" data-testid={`card-file-${f.id}`}>
                  <Card className="hover:border-blue-400 transition-colors bg-card h-full flex flex-col">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                      <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg"><FileIcon className="w-5 h-5" /></div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 z-10" onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          if (confirm("Remove file link?")) deleteFile.mutate({ id: f.id }, { onSuccess: invalidateFiles });
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground">
              No files linked yet.
            </div>
          )}
        </TabsContent>

        {/* ── VIDEOS ────────────────────────────────────────────── */}
        <TabsContent value="videos" className="space-y-4 outline-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Video Resources</h3>
            <Button
              size="sm"
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
              onClick={() => { setVideoForm({ id: 0, title: "", url: "", description: "" }); setIsVideoOpen(true); }}
              data-testid="button-add-video"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Video
            </Button>
          </div>

          {videos?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map(v => (
                <Card key={v.id} className="overflow-hidden border-border bg-card group" data-testid={`card-video-${v.id}`}>
                  <div className="aspect-video bg-muted relative flex items-center justify-center border-b border-border">
                    <Video className="w-10 h-10 text-muted-foreground/30" />
                    <a href={v.url} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors" />
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
                          if (confirm("Delete video?")) deleteVideo.mutate({ id: v.id }, { onSuccess: invalidateVideos });
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
            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground">
              No videos added yet.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── NOTE DIALOG ───────────────────────────────────────── */}
      <Dialog open={isNoteOpen} onOpenChange={(open) => { setIsNoteOpen(open); if (!open) setNoteForm({ id: 0, title: "", content: "" }); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{noteForm.id ? "Edit Note" : "New Note"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (noteForm.id) {
              updateNote.mutate({ id: noteForm.id, data: { title: noteForm.title, content: noteForm.content } }, {
                onSuccess: () => { invalidateNotes(); setIsNoteOpen(false); }
              });
            } else {
              createNote.mutate({ topicId, data: { title: noteForm.title, content: noteForm.content } }, {
                onSuccess: () => { invalidateNotes(); setIsNoteOpen(false); }
              });
            }
          }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input id="note-title" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} required placeholder="e.g. Chapter 1 – Newton's Laws" data-testid="input-note-title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">Content</Label>
              <Textarea id="note-content" value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} rows={10} className="font-mono text-sm" placeholder="Write your notes here…" data-testid="input-note-content" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNoteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createNote.isPending || updateNote.isPending} data-testid="button-save-note">
                {(createNote.isPending || updateNote.isPending) ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── FORMULA DIALOG ────────────────────────────────────── */}
      <Dialog open={isFormulaOpen} onOpenChange={(open) => { setIsFormulaOpen(open); if (!open) setFormulaForm(emptyFormulaForm()); }}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{formulaForm.id ? "Edit Formula" : "New Formula"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const payload = {
              title: formulaForm.title,
              content: formulaForm.content || undefined,
              driveShareableLink: formulaForm.driveShareableLink || undefined,
              originalName: formulaForm.originalName || undefined,
              fileType: formulaForm.fileType || undefined,
            };
            if (formulaForm.id) {
              updateFormula.mutate({ id: formulaForm.id, data: payload }, {
                onSuccess: () => { invalidateFormulas(); setIsFormulaOpen(false); }
              });
            } else {
              createFormula.mutate({ topicId, data: payload }, {
                onSuccess: () => { invalidateFormulas(); setIsFormulaOpen(false); }
              });
            }
          }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="formula-title">Title</Label>
              <Input id="formula-title" value={formulaForm.title} onChange={(e) => setFormulaForm({ ...formulaForm, title: e.target.value })} required placeholder="e.g. Chapter 1 Notes" data-testid="input-formula-title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formula-content">Notes / Content <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea id="formula-content" value={formulaForm.content} onChange={(e) => setFormulaForm({ ...formulaForm, content: e.target.value })} rows={4} className="font-mono" placeholder="F = ma, or any formula / concept…" data-testid="input-formula-content" />
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Attach a Drive File <span className="text-xs">(optional)</span></p>
              <div className="space-y-2">
                <Label htmlFor="formula-drive-link">Drive Shareable Link</Label>
                <Input id="formula-drive-link" value={formulaForm.driveShareableLink} onChange={(e) => setFormulaForm({ ...formulaForm, driveShareableLink: e.target.value })} placeholder="https://drive.google.com/file/d/…" data-testid="input-formula-drive-link" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="formula-original-name">Original Filename <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="formula-original-name" value={formulaForm.originalName} onChange={(e) => setFormulaForm({ ...formulaForm, originalName: e.target.value })} placeholder="document.pdf" data-testid="input-formula-original-name" />
                </div>
                <div className="space-y-2">
                  <Label>File Type</Label>
                  <Select value={formulaForm.fileType || "pdf"} onValueChange={(val) => setFormulaForm({ ...formulaForm, fileType: val })}>
                    <SelectTrigger data-testid="select-formula-file-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
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
              <Button type="submit" disabled={createFormula.isPending || updateFormula.isPending} data-testid="button-save-formula">
                {(createFormula.isPending || updateFormula.isPending) ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── FILE DIALOG ───────────────────────────────────────── */}
      <Dialog open={isFileOpen} onOpenChange={(open) => { setIsFileOpen(open); if (!open) setFileForm({ title: "", driveShareableLink: "", originalName: "", fileType: "pdf" }); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Link File from Google Drive</DialogTitle>
          </DialogHeader>
          <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-900 mb-2">
            Upload your file to Google Drive first, then paste the shareable link below.
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            uploadFile.mutate({
              topicId,
              data: {
                title: fileForm.title,
                driveShareableLink: fileForm.driveShareableLink,
                driveFileId: "manual",
                originalName: fileForm.originalName || fileForm.title,
                mimeType: fileForm.fileType,
                fileType: fileForm.fileType,
              }
            }, {
              onSuccess: () => { invalidateFiles(); setIsFileOpen(false); }
            });
          }} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="file-title">Title</Label>
              <Input id="file-title" value={fileForm.title} onChange={(e) => setFileForm({ ...fileForm, title: e.target.value })} placeholder="e.g. Chapter 1 Notes" required data-testid="input-file-title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-drive-link">Drive Shareable Link</Label>
              <Input id="file-drive-link" value={fileForm.driveShareableLink} onChange={(e) => setFileForm({ ...fileForm, driveShareableLink: e.target.value })} placeholder="https://drive.google.com/file/d/…" required data-testid="input-file-drive-link" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file-original-name">Original Filename <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="file-original-name" value={fileForm.originalName} onChange={(e) => setFileForm({ ...fileForm, originalName: e.target.value })} placeholder="document.pdf" data-testid="input-file-original-name" />
              </div>
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select value={fileForm.fileType} onValueChange={(val) => setFileForm({ ...fileForm, fileType: val })}>
                  <SelectTrigger data-testid="select-file-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFileOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={uploadFile.isPending} data-testid="button-save-file">
                {uploadFile.isPending ? "Linking…" : "Link File"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── VIDEO DIALOG ──────────────────────────────────────── */}
      <Dialog open={isVideoOpen} onOpenChange={(open) => { setIsVideoOpen(open); if (!open) setVideoForm({ id: 0, title: "", url: "", description: "" }); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{videoForm.id ? "Edit Video" : "New Video"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (videoForm.id) {
              updateVideo.mutate({ id: videoForm.id, data: { title: videoForm.title, url: videoForm.url, description: videoForm.description } }, {
                onSuccess: () => { invalidateVideos(); setIsVideoOpen(false); }
              });
            } else {
              createVideo.mutate({ topicId, data: { title: videoForm.title, url: videoForm.url, description: videoForm.description } }, {
                onSuccess: () => { invalidateVideos(); setIsVideoOpen(false); }
              });
            }
          }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="video-title">Video Title</Label>
              <Input id="video-title" value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} required placeholder="e.g. Lecture 3 – Integration" data-testid="input-video-title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-url">URL (YouTube, Drive, etc.)</Label>
              <Input id="video-url" value={videoForm.url} onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })} type="url" required placeholder="https://youtube.com/watch?v=…" data-testid="input-video-url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-description">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea id="video-description" value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} rows={2} placeholder="What's covered in this video?" data-testid="input-video-description" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsVideoOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createVideo.isPending || updateVideo.isPending} data-testid="button-save-video">
                {(createVideo.isPending || updateVideo.isPending) ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
