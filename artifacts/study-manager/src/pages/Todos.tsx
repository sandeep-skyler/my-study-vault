import { useState } from "react";
import { useListTodos, useCreateTodo, useUpdateTodo, useDeleteTodo, useCompleteTodo, useListSubjects } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, CheckSquare, Trash2, CalendarIcon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function Todos() {
  const { data: todos, isLoading } = useListTodos();
  const { data: subjects } = useListSubjects();
  
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const completeTodo = useCompleteTodo();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState("pending");
  
  const [formData, setFormData] = useState({
    text: "",
    subjectId: "none",
    dueDate: "",
  });

  const resetForm = () => {
    setFormData({ text: "", subjectId: "none", dueDate: "" });
  };

  const handleToggle = (id: number) => {
    completeTodo.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/todos"] });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteTodo.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/todos"] });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      text: formData.text,
      subjectId: formData.subjectId !== "none" ? parseInt(formData.subjectId) : undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
    };

    createTodo.mutate(
      { data: submitData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/todos"] });
          setIsDialogOpen(false);
          resetForm();
        }
      }
    );
  };

  const filteredTodos = todos?.filter(todo => {
    if (filter === "pending") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  }) || [];

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <PageHeader 
        title="Todos" 
        description="Track your assignments and tasks." 
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="text">Task Description</Label>
                  <Input 
                    id="text" 
                    value={formData.text} 
                    onChange={(e) => setFormData({...formData, text: e.target.value})} 
                    placeholder="e.g., Read chapter 4" 
                    required 
                    autoFocus
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Related Subject</Label>
                    <Select value={formData.subjectId} onValueChange={(val) => setFormData({...formData, subjectId: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {subjects?.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Due Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={formData.dueDate} 
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                    />
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

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="mb-6 bg-card border border-border">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
        </TabsList>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>
          ) : filteredTodos.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredTodos.map((todo) => (
                <div 
                  key={todo.id} 
                  className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${todo.completed ? 'opacity-60 bg-muted/20' : ''}`}
                >
                  <Checkbox 
                    checked={todo.completed} 
                    onCheckedChange={() => handleToggle(todo.id)} 
                    className="w-5 h-5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {todo.text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {todo.subjectName && (
                        <Badge variant="secondary" className="text-[10px] font-medium px-2 bg-secondary text-secondary-foreground">
                          {todo.subjectName}
                        </Badge>
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
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(todo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
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
      </Tabs>
    </div>
  );
}