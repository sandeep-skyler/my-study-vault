import { useState } from "react";
import {
  useListTodos, useCreateTodo, useDeleteTodo, useCompleteTodo, useListSubjects,
  getListTodosQueryKey, getGetDashboardStatsQueryKey, getGetDashboardTodosQueryKey,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckSquare, Trash2, CalendarIcon, CheckCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Todos() {
  const { data: todos, isLoading } = useListTodos();
  const { data: subjects } = useListSubjects();
  const queryClient = useQueryClient();

  const createTodo = useCreateTodo();
  const deleteTodo = useDeleteTodo();
  const completeTodo = useCompleteTodo();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState({ text: "", subjectId: "none", dueDate: "" });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTodosQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardTodosQueryKey() });
  };

  const resetForm = () => setFormData({ text: "", subjectId: "none", dueDate: "" });

  const handleToggle = (id: number) => {
    completeTodo.mutate({ id }, { onSuccess: invalidate });
  };

  const handleDelete = (id: number) => {
    deleteTodo.mutate({ id }, { onSuccess: invalidate });
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTodo.mutate({
      data: {
        text: formData.text,
        subjectId: formData.subjectId !== "none" ? parseInt(formData.subjectId) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      }
    }, {
      onSuccess: () => { invalidate(); setIsDialogOpen(false); resetForm(); }
    });
  };

  const filteredTodos = todos?.filter(todo => {
    if (filter === "pending") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  }) || [];

  const visibleSelectedIds = new Set([...selectedIds].filter(id => filteredTodos.some(t => t.id === id)));
  const allVisibleSelected = filteredTodos.length > 0 && filteredTodos.every(t => visibleSelectedIds.has(t.id));

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => { const s = new Set(prev); filteredTodos.forEach(t => s.delete(t.id)); return s; });
    } else {
      setSelectedIds(prev => { const s = new Set(prev); filteredTodos.forEach(t => s.add(t.id)); return s; });
    }
  };

  const handleBulkComplete = async () => {
    const ids = [...visibleSelectedIds];
    await Promise.all(ids.map(id => completeTodo.mutateAsync({ id })));
    invalidate();
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${visibleSelectedIds.size} selected task${visibleSelectedIds.size > 1 ? "s" : ""}?`)) return;
    const ids = [...visibleSelectedIds];
    await Promise.all(ids.map(id => deleteTodo.mutateAsync({ id })));
    invalidate();
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <PageHeader
        title="Todos"
        description="Track your assignments and tasks."
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Task</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="text">Task Description</Label>
                  <Input id="text" value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })} placeholder="e.g., Read chapter 4" required autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Related Subject</Label>
                    <Select value={formData.subjectId} onValueChange={(val) => setFormData({ ...formData, subjectId: val })}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {subjects?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Due Date</Label>
                    <Input id="date" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Add Task</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={(v) => { setFilter(v); setSelectedIds(new Set()); }}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bulk action bar */}
        {visibleSelectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium text-primary">{visibleSelectedIds.size} selected</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-green-600 hover:bg-green-50 hover:text-green-700 gap-1.5"
              onClick={handleBulkComplete}
            >
              <CheckCheck className="w-4 h-4" /> Mark done
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading tasks…</div>
        ) : filteredTodos.length > 0 ? (
          <>
            {/* Select-all row */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={toggleAll}
                className="w-4 h-4"
              />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Select all ({filteredTodos.length})
              </span>
            </div>
            <div className="divide-y divide-border">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${todo.completed ? "opacity-60 bg-muted/20" : ""} ${visibleSelectedIds.has(todo.id) ? "bg-primary/5" : ""}`}
                >
                  {/* Row-select checkbox */}
                  <Checkbox
                    checked={visibleSelectedIds.has(todo.id)}
                    onCheckedChange={() => toggleSelect(todo.id)}
                    className="w-4 h-4 flex-shrink-0"
                  />
                  {/* Done-toggle checkbox */}
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => handleToggle(todo.id)}
                    className="w-5 h-5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${todo.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {todo.text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {(todo as any).subjectName && (
                        <Badge variant="secondary" className="text-[10px] font-medium px-2">{(todo as any).subjectName}</Badge>
                      )}
                      {todo.dueDate && (
                        <span className="flex items-center text-xs font-medium text-muted-foreground">
                          <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                          {format(new Date(todo.dueDate), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    onClick={() => handleDelete(todo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 flex flex-col items-center">
            <CheckSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-medium text-foreground">No tasks found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {filter === "pending" ? "You're all caught up!" : "No tasks match this filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
