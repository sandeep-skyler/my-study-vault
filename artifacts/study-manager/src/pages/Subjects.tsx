import { useState } from "react";
import { useListSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, BookOpen, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", 
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#f43f5e"
];

export default function Subjects() {
  const { data: subjects, isLoading } = useListSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: PRESET_COLORS[10],
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", color: PRESET_COLORS[10] });
    setEditingId(null);
  };

  const handleOpenEdit = (subject: any) => {
    setFormData({
      name: subject.name,
      description: subject.description || "",
      color: subject.color,
    });
    setEditingId(subject.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this subject? All topics and materials inside will be lost.")) {
      deleteSubject.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSubject.mutate(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
            setIsDialogOpen(false);
            resetForm();
          }
        }
      );
    } else {
      createSubject.mutate(
        { data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            setIsDialogOpen(false);
            resetForm();
          }
        }
      );
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Subjects" 
        description="Manage your classes and courses." 
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Subject" : "New Subject"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g., Advanced Calculus" 
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
                    placeholder="e.g., MATH 301 - Prof. Smith" 
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({...formData, color})}
                      />
                    ))}
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingId ? "Save Changes" : "Create Subject"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : subjects && subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subjects.map((subject) => (
            <Card key={subject.id} className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
              <CardHeader className="pb-3 relative">
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEdit(subject)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDelete(subject.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl line-clamp-1" title={subject.name}>{subject.name}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-0.5">Created {format(new Date(subject.createdAt), "MMM yyyy")}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-0">
                <CardDescription className="line-clamp-2 mb-4 flex-1">
                  {subject.description || "No description provided."}
                </CardDescription>
                <Link href={`/subjects/${subject.id}`} className="w-full">
                  <Button variant="secondary" className="w-full bg-secondary hover:bg-secondary/80">
                    Open Subject
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No subjects yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first subject to start organizing your study materials, notes, and topics.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create First Subject
          </Button>
        </div>
      )}
    </div>
  );
}