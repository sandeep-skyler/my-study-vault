import { useState } from "react";
import { useGetSubject, useListTopics, useCreateTopic, useUpdateTopic, useDeleteTopic } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Trash2, Layers, ChevronRight, BookOpen } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function SubjectDetail() {
  const params = useParams();
  const subjectId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();

  const { data: subject, isLoading: isSubjectLoading } = useGetSubject(subjectId, {
    query: { enabled: !!subjectId }
  });
  
  const { data: topics, isLoading: isTopicsLoading } = useListTopics(subjectId, {
    query: { enabled: !!subjectId }
  });

  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingId(null);
  };

  const handleOpenEdit = (topic: any) => {
    setFormData({
      name: topic.name,
      description: topic.description || "",
    });
    setEditingId(topic.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this topic? All notes, files, and materials inside will be lost.")) {
      deleteTopic.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/subjects", subjectId, "topics"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateTopic.mutate(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subjects", subjectId, "topics"] });
            setIsDialogOpen(false);
            resetForm();
          }
        }
      );
    } else {
      createTopic.mutate(
        { subjectId, data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subjects", subjectId, "topics"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            setIsDialogOpen(false);
            resetForm();
          }
        }
      );
    }
  };

  if (isSubjectLoading) {
    return <div className="p-8">Loading subject details...</div>;
  }

  if (!subject) {
    return <div className="p-8">Subject not found.</div>;
  }

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
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" style={{ backgroundColor: subject.color, color: '#fff' }}>
                <Plus className="w-4 h-4" /> Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Topic" : "New Topic"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Topic Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g., Derivatives" 
                    required 
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    placeholder="Brief description of the topic..." 
                    rows={2}
                  />
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

      {isTopicsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : topics && topics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Card key={topic.id} className="overflow-hidden hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3 relative">
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEdit(topic)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
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
                    <CardTitle className="text-lg line-clamp-1" title={topic.name}>{topic.name}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-0.5">Created {format(new Date(topic.createdAt), "MMM d")}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="line-clamp-2 mb-4 h-10">
                  {topic.description || "No description provided."}
                </CardDescription>
                <Link href={`/topics/${topic.id}`}>
                  <Button variant="outline" className="w-full justify-between group-hover:border-primary/50 transition-colors">
                    View Materials <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
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
          <Button onClick={() => setIsDialogOpen(true)} style={{ backgroundColor: subject.color, color: '#fff' }}>
            <Plus className="w-4 h-4 mr-2" /> Create First Topic
          </Button>
        </div>
      )}
    </div>
  );
}