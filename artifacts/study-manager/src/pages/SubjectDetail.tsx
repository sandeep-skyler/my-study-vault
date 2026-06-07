import { useState } from "react";
import {
  useGetSubject, useListTopics, useCreateTopic, useUpdateTopic, useDeleteTopic,
  getListTopicsQueryKey, getGetTopicQueryKey,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Edit, Trash2, Layers, ChevronRight, BookOpen, CheckCircle2, Circle, Clock } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type Status = "not_started" | "in_progress" | "completed";

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; badge: string }> = {
  not_started: { label: "Not Started", icon: Circle, badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  in_progress: { label: "In Progress", icon: Clock, badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  completed: { label: "Completed", icon: CheckCircle2, badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
};

function StatusBadge({ status, topicId, onStatusChange }: { status: Status; topicId: number; onStatusChange: (id: number, s: Status) => void }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started;
  const Icon = cfg.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${cfg.badge} hover:opacity-80 transition-opacity`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([s, c]) => {
          const SI = c.icon;
          return (
            <DropdownMenuItem key={s} onClick={() => onStatusChange(topicId, s)} className="gap-2">
              <SI className="w-4 h-4" /> {c.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function SubjectDetail() {
  const params = useParams();
  const subjectId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: subject, isLoading: isSubjectLoading } = useGetSubject(subjectId, { query: { enabled: !!subjectId } as any });
  const { data: topics, isLoading: isTopicsLoading } = useListTopics(subjectId, { query: { enabled: !!subjectId } as any });

  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const invalidateTopics = () => queryClient.invalidateQueries({ queryKey: getListTopicsQueryKey(subjectId) });

  const resetForm = () => { setFormData({ name: "", description: "" }); setEditingId(null); };

  const handleOpenEdit = (topic: any) => {
    setFormData({ name: topic.name, description: topic.description || "" });
    setEditingId(topic.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this topic? All materials inside will be lost.")) {
      deleteTopic.mutate({ id }, { onSuccess: invalidateTopics });
    }
  };

  const handleStatusChange = (id: number, status: Status) => {
    updateTopic.mutate({ id, data: { status } }, {
      onSuccess: () => {
        invalidateTopics();
        queryClient.invalidateQueries({ queryKey: getGetTopicQueryKey(id) });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateTopic.mutate({ id: editingId, data: formData }, {
        onSuccess: () => { invalidateTopics(); setIsDialogOpen(false); resetForm(); }
      });
    } else {
      createTopic.mutate({ subjectId, data: formData }, {
        onSuccess: () => { invalidateTopics(); setIsDialogOpen(false); resetForm(); }
      });
    }
  };

  if (isSubjectLoading) return <div className="p-8 text-muted-foreground">Loading subject…</div>;
  if (!subject) return <div className="p-8">Subject not found.</div>;

  const statusCounts = topics ? {
    completed: topics.filter(t => (t as any).status === "completed").length,
    in_progress: topics.filter(t => (t as any).status === "in_progress").length,
    not_started: topics.filter(t => !((t as any).status) || (t as any).status === "not_started").length,
  } : null;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/subjects" className="hover:text-foreground hover:underline transition-colors flex items-center gap-1">
          <BookOpen className="w-4 h-4" /> Subjects
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">{subject.name}</span>
      </div>

      <PageHeader
        title={subject.name}
        description={subject.description || "Manage topics for this subject."}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" style={{ backgroundColor: subject.color, color: "#fff" }}>
                <Plus className="w-4 h-4" /> Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>{editingId ? "Edit Topic" : "New Topic"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Topic Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Derivatives" required autoFocus />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description…" rows={2} />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingId ? "Save Changes" : "Create Topic"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Progress summary */}
      {statusCounts && topics && topics.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
          <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden flex">
            {statusCounts.completed > 0 && (
              <div className="h-full bg-green-500 transition-all" style={{ width: `${(statusCounts.completed / topics.length) * 100}%` }} />
            )}
            {statusCounts.in_progress > 0 && (
              <div className="h-full bg-blue-400 transition-all" style={{ width: `${(statusCounts.in_progress / topics.length) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center gap-3 text-sm flex-shrink-0">
            {statusCounts.completed > 0 && <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{statusCounts.completed} done</span>}
            {statusCounts.in_progress > 0 && <span className="text-blue-500 font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{statusCounts.in_progress} in progress</span>}
            {statusCounts.not_started > 0 && <span className="text-muted-foreground font-medium">{statusCounts.not_started} not started</span>}
          </div>
        </div>
      )}

      {isTopicsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : topics && topics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const status = ((topic as any).status || "not_started") as Status;
            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started;
            return (
              <Card key={topic.id} className={`overflow-hidden hover:shadow-md transition-shadow group ${status === "completed" ? "border-green-200 dark:border-green-900" : ""}`}>
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(topic)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDelete(topic.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground shadow-sm">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base line-clamp-1" title={topic.name}>{topic.name}</CardTitle>
                      <div className="text-xs text-muted-foreground mt-0.5">Created {format(new Date(topic.createdAt), "MMM d")}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                    {topic.description || "No description provided."}
                  </CardDescription>
                  <StatusBadge status={status} topicId={topic.id} onStatusChange={handleStatusChange} />
                  <Link href={`/topics/${topic.id}`}>
                    <Button variant="outline" className="w-full justify-between group-hover:border-primary/50 transition-colors mt-1">
                      View Materials <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No topics yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Break down your subject into topics to organize notes, formulas, and files.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} style={{ backgroundColor: subject.color, color: "#fff" }}>
            <Plus className="w-4 h-4 mr-2" /> Create First Topic
          </Button>
        </div>
      )}
    </div>
  );
}
