import { useState, useEffect } from "react";
import { 
  useGetTopic, 
  useGetSubject,
  useListNotes, useCreateNote, useUpdateNote, useDeleteNote,
  useListFormulas, useCreateFormula, useUpdateFormula, useDeleteFormula, useToggleFormulaStar,
  useGetTopicFiles, useUploadFile, useDeleteFile,
  useListVideos, useCreateVideo, useUpdateVideo, useDeleteVideo,
  useCreateBookmark, useDeleteBookmark, useListBookmarks
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, ChevronRight, BookOpen, Layers, FileText, FunctionSquare, FileIcon, Video, Star, Bookmark, ExternalLink, BookmarkMinus } from "lucide-react";
import { Link, useParams, useLocation, useSearch } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function TopicDetail() {
  const params = useParams();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialTab = searchParams.get('tab') || 'notes';
  
  const topicId = parseInt(params.id || "0");
  const [activeTab, setActiveTab] = useState(initialTab);

  const { data: topic, isLoading: isTopicLoading } = useGetTopic(topicId, { query: { enabled: !!topicId } });
  const { data: subject } = useGetSubject(topic?.subjectId || 0, { query: { enabled: !!topic?.subjectId } });
  
  // Data hooks
  const { data: notes } = useListNotes(topicId, { query: { enabled: !!topicId } });
  const { data: formulas } = useListFormulas(topicId, { query: { enabled: !!topicId } });
  const { data: files } = useGetTopicFiles(topicId, { query: { enabled: !!topicId } });
  const { data: videos } = useListVideos(topicId, { query: { enabled: !!topicId } });
  const { data: bookmarks } = useListBookmarks();

  // Mutations
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

  // Modals state
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ id: 0, title: "", content: "" });

  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [formulaForm, setFormulaForm] = useState({ id: 0, title: "", content: "" });

  const [isFileOpen, setIsFileOpen] = useState(false);
  const [fileForm, setFileForm] = useState({ title: "", driveShareableLink: "", originalName: "", fileType: "pdf" });

  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoForm, setVideoForm] = useState({ id: 0, title: "", url: "", description: "" });

  // Bookmark helpers
  const isBookmarked = (type: string, id: number) => {
    return bookmarks?.some(b => b.itemType === type && b.itemId === id) || false;
  };

  const getBookmarkId = (type: string, id: number) => {
    return bookmarks?.find(b => b.itemType === type && b.itemId === id)?.id;
  };

  const handleToggleBookmark = (type: any, id: number, title: string) => {
    const existingId = getBookmarkId(type, id);
    if (existingId) {
      removeBookmark.mutate({ id: existingId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] })
      });
    } else {
      createBookmark.mutate({ data: { itemType: type, itemId: id, title } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] })
      });
    }
  };

  if (isTopicLoading || !topic) return <div className="p-8">Loading topic details...</div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/subjects" className="hover:text-foreground hover:underline transition-colors flex items-center gap-1">
          <BookOpen className="w-4 h-4" /> Subjects
        </Link>
        <ChevronRight className="w-4 h-4" />
        {subject && (
          <>
            <Link href={`/subjects/${subject.id}`} className="hover:text-foreground hover:underline transition-colors flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }}></span>
              {subject.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span className="text-foreground font-medium">{topic.name}</span>
      </div>

      <PageHeader 
        title={topic.name} 
        description={topic.description || ""} 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-card border border-border h-12 w-full justify-start p-1 overflow-x-auto flex-nowrap hide-scrollbar">
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

        {/* NOTES TAB */}
        <TabsContent value="notes" className="space-y-4 outline-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Class Notes</h3>
            <Dialog open={isNoteOpen} onOpenChange={(open) => {
              setIsNoteOpen(open);
              if (!open) setNoteForm({ id: 0, title: "", content: "" });
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white"><Plus className="w-4 h-4 mr-2" /> Add Note</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{noteForm.id ? "Edit Note" : "New Note"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (noteForm.id) {
                    updateNote.mutate({ id: noteForm.id, data: { title: noteForm.title, content: noteForm.content } }, {
                      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "notes"] }); setIsNoteOpen(false); }
                    });
                  } else {
                    createNote.mutate({ data: { title: noteForm.title, content: noteForm.content, topicId } }, {
                      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "notes"] }); setIsNoteOpen(false); }
                    });
                  }
                }} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={noteForm.title} onChange={(e) => setNoteForm({...noteForm, title: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea value={noteForm.content} onChange={(e) => setNoteForm({...noteForm, content: e.target.value})} rows={10} className="font-mono text-sm" />
                  </div>
                  <DialogFooter><Button type="submit">Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {notes?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map(note => (
                <Card key={note.id} className="group overflow-hidden border-border flex flex-col">
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base leading-tight font-bold">{note.title}</CardTitle>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{format(new Date(note.updatedAt || note.createdAt), "MMM d, yyyy")}</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleBookmark('note', note.id, note.title)}>
                        {isBookmarked('note', note.id) ? <BookmarkMinus className="w-4 h-4 text-violet-500" /> : <Bookmark className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setNoteForm({ id: note.id, title: note.title, content: note.content || "" }); setIsNoteOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => {
                        if(confirm("Delete note?")) deleteNote.mutate({id: note.id}, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "notes"] }) });
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
            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground">No notes added yet.</div>
          )}
        </TabsContent>

        {/* FORMULAS TAB */}
        <TabsContent value="formulas" className="space-y-4 outline-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Formulas & Concepts</h3>
            <Dialog open={isFormulaOpen} onOpenChange={(open) => {
              setIsFormulaOpen(open);
              if (!open) setFormulaForm({ id: 0, title: "", content: "" });
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white"><Plus className="w-4 h-4 mr-2" /> Add Formula</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>{formulaForm.id ? "Edit Formula" : "New Formula"}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (formulaForm.id) {
                    updateFormula.mutate({ id: formulaForm.id, data: { title: formulaForm.title, content: formulaForm.content } }, {
                      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "formulas"] }); setIsFormulaOpen(false); }
                    });
                  } else {
                    createFormula.mutate({ data: { title: formulaForm.title, content: formulaForm.content, topicId } }, {
                      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "formulas"] }); setIsFormulaOpen(false); }
                    });
                  }
                }} className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Title / Name</Label><Input value={formulaForm.title} onChange={(e) => setFormulaForm({...formulaForm, title: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>Formula Content</Label><Textarea value={formulaForm.content} onChange={(e) => setFormulaForm({...formulaForm, content: e.target.value})} required rows={4} className="font-mono" /></div>
                  <DialogFooter><Button type="submit">Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {formulas?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formulas.map(f => (
                <div key={f.id} className={`p-4 rounded-xl border relative group ${f.isImportant ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-900/10' : 'bg-card border-border'}`}>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button className="text-amber-500 hover:scale-110 transition-transform" onClick={() => {
                      toggleStar.mutate({ id: f.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "formulas"] }) })
                    }}>
                      <Star className={`w-5 h-5 ${f.isImportant ? 'fill-amber-500' : ''}`} />
                    </button>
                    <button className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-all" onClick={() => {
                      setFormulaForm({ id: f.id, title: f.title, content: f.content }); setIsFormulaOpen(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all" onClick={() => {
                      if(confirm("Delete formula?")) deleteFormula.mutate({id: f.id}, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "formulas"] }) });
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-foreground mb-3 pr-20">{f.title}</h4>
                  <div className="bg-background border border-border p-3 rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap">{f.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground">No formulas added yet.</div>
          )}
        </TabsContent>

        {/* FILES TAB */}
        <TabsContent value="files" className="space-y-4 outline-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Documents & Files</h3>
            <Dialog open={isFileOpen} onOpenChange={(open) => {
              setIsFileOpen(open);
              if (!open) setFileForm({ title: "", driveShareableLink: "", originalName: "", fileType: "pdf" });
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" /> Link Drive File</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Link File from Google Drive</DialogTitle>
                </DialogHeader>
                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-900 mb-2">
                  Files are stored securely in your Google Drive. Upload your file there first, then paste the shareable link below.
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
                      fileType: fileForm.fileType 
                    } 
                  }, {
                    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "files"] }); setIsFileOpen(false); }
                  });
                }} className="space-y-4 py-2">
                  <div className="space-y-2"><Label>Title</Label><Input value={fileForm.title} onChange={(e) => setFileForm({...fileForm, title: e.target.value})} placeholder="e.g. Chapter 1 Notes" required /></div>
                  <div className="space-y-2"><Label>Drive Shareable Link</Label><Input value={fileForm.driveShareableLink} onChange={(e) => setFileForm({...fileForm, driveShareableLink: e.target.value})} placeholder="https://drive.google.com/file/d/..." required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Original Filename (optional)</Label><Input value={fileForm.originalName} onChange={(e) => setFileForm({...fileForm, originalName: e.target.value})} placeholder="document.pdf" /></div>
                    <div className="space-y-2">
                      <Label>File Type</Label>
                      <Select value={fileForm.fileType} onValueChange={(val) => setFileForm({...fileForm, fileType: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter><Button type="submit">Link File</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {files?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {files.map(f => (
                <a key={f.id} href={f.driveShareableLink} target="_blank" rel="noreferrer" className="block group">
                  <Card className="hover:border-blue-400 transition-colors bg-card h-full flex flex-col">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                      <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg"><FileIcon className="w-5 h-5" /></div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 z-10" onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          if(confirm("Remove file link?")) deleteFile.mutate({id: f.id}, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "files"] }) });
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <h4 className="font-bold text-sm line-clamp-2 leading-tight">{f.title}</h4>
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

        {/* VIDEOS TAB */}
        <TabsContent value="videos" className="space-y-4 outline-none">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Video Resources</h3>
            <Dialog open={isVideoOpen} onOpenChange={(open) => {
              setIsVideoOpen(open);
              if (!open) setVideoForm({ id: 0, title: "", url: "", description: "" });
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"><Plus className="w-4 h-4 mr-2" /> Add Video</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle>{videoForm.id ? "Edit Video" : "New Video"}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (videoForm.id) {
                    updateVideo.mutate({ id: videoForm.id, data: { title: videoForm.title, url: videoForm.url, description: videoForm.description } }, {
                      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "videos"] }); setIsVideoOpen(false); }
                    });
                  } else {
                    createVideo.mutate({ data: { title: videoForm.title, url: videoForm.url, description: videoForm.description, topicId } }, {
                      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "videos"] }); setIsVideoOpen(false); }
                    });
                  }
                }} className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Video Title</Label><Input value={videoForm.title} onChange={(e) => setVideoForm({...videoForm, title: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>URL (YouTube, etc.)</Label><Input value={videoForm.url} onChange={(e) => setVideoForm({...videoForm, url: e.target.value})} type="url" required /></div>
                  <div className="space-y-2"><Label>Description (optional)</Label><Textarea value={videoForm.description} onChange={(e) => setVideoForm({...videoForm, description: e.target.value})} rows={2} /></div>
                  <DialogFooter><Button type="submit">Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {videos?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map(v => (
                <Card key={v.id} className="overflow-hidden border-border bg-card group">
                  <div className="aspect-video bg-muted relative flex items-center justify-center border-b border-border">
                    <Video className="w-10 h-10 text-muted-foreground/30" />
                    <a href={v.url} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-background/80 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-5 h-5 text-fuchsia-600" />
                      </div>
                    </a>
                  </div>
                  <CardContent className="p-4 relative">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card p-1 rounded-md shadow-sm border border-border">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleBookmark('video', v.id, v.title)}>
                        {isBookmarked('video', v.id) ? <BookmarkMinus className="w-3 h-3 text-fuchsia-500" /> : <Bookmark className="w-3 h-3" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setVideoForm({ id: v.id, title: v.title, url: v.url, description: v.description || "" }); setIsVideoOpen(true); }}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => {
                        if(confirm("Delete video?")) deleteVideo.mutate({id: v.id}, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "videos"] }) });
                      }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <h4 className="font-bold text-sm mb-1 pr-16 leading-tight">{v.title}</h4>
                    {v.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{v.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground">No videos added yet.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}