import { useState } from "react";
import { useListQuickNotes, useCreateQuickNote, useUpdateQuickNote, useDeleteQuickNote } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, StickyNote, Trash2, Edit2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

const PRESET_COLORS = [
  "#fef08a", // yellow
  "#bbf7d0", // green
  "#bfdbfe", // blue
  "#fbcfe8", // pink
  "#fed7aa", // orange
  "#e9d5ff", // purple
];

export default function QuickNotes() {
  const { data: notes, isLoading } = useListQuickNotes();
  const createNote = useCreateQuickNote();
  const updateNote = useUpdateQuickNote();
  const deleteNote = useDeleteQuickNote();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    color: PRESET_COLORS[0],
  });

  const resetForm = () => {
    setFormData({ title: "", content: "", color: PRESET_COLORS[0] });
    setEditingId(null);
  };

  const handleOpenEdit = (note: any) => {
    setFormData({
      title: note.title,
      content: note.content || "",
      color: note.color,
    });
    setEditingId(note.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this quick note?")) {
      deleteNote.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/quick-notes"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/quick-notes/recent"] });
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateNote.mutate(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/quick-notes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/quick-notes/recent"] });
            setIsDialogOpen(false);
            resetForm();
          }
        }
      );
    } else {
      createNote.mutate(
        { data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/quick-notes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/quick-notes/recent"] });
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
        title="Quick Notes" 
        description="Fast, color-coded sticky notes for passing thoughts." 
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Note" : "New Quick Note"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    placeholder="Note title" 
                    required 
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea 
                    id="content" 
                    value={formData.content} 
                    onChange={(e) => setFormData({...formData, content: e.target.value})} 
                    placeholder="Write something..." 
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-3 mt-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all ${formData.color === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({...formData, color})}
                      />
                    ))}
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingId ? "Save Changes" : "Create Note"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-48 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {notes.map((note) => (
            <div 
              key={note.id} 
              className="group relative flex flex-col rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer min-h-[12rem]"
              style={{ backgroundColor: note.color, color: '#1e293b' }} // Dark text for light sticky notes
              onClick={() => handleOpenEdit(note)}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button 
                  className="p-1.5 bg-black/5 hover:bg-black/10 rounded text-black/60 hover:text-black transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(note); }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  className="p-1.5 bg-black/5 hover:bg-red-500/20 hover:text-red-700 rounded text-black/60 transition-colors"
                  onClick={(e) => handleDelete(note.id, e)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <h3 className="font-bold text-lg mb-2 pr-12 line-clamp-2 leading-tight">{note.title}</h3>
              <p className="text-sm whitespace-pre-wrap flex-1 opacity-90 line-clamp-6 leading-relaxed">
                {note.content}
              </p>
              
              <div className="text-[10px] uppercase tracking-wider font-semibold opacity-50 mt-4 pt-3 border-t border-black/10">
                {format(new Date(note.updatedAt || note.createdAt), "MMM d, yyyy")}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <StickyNote className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No quick notes yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Jot down thoughts, ideas, or reminders quickly.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Write First Note
          </Button>
        </div>
      )}
    </div>
  );
}