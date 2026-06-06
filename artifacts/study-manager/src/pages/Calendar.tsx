import { useState } from "react";
import { useListCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent, useListSubjects } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: events, isLoading } = useListCalendarEvents();
  const { data: subjects } = useListSubjects();
  
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    eventType: "event" as "exam" | "reminder" | "deadline" | "event",
    subjectId: "none",
  });

  const resetForm = (dateOverride?: Date) => {
    setFormData({ 
      title: "", 
      description: "", 
      date: format(dateOverride || new Date(), "yyyy-MM-dd"),
      eventType: "event",
      subjectId: "none"
    });
    setEditingId(null);
  };

  const handleOpenEdit = (event: any) => {
    setFormData({
      title: event.title,
      description: event.description || "",
      date: format(new Date(event.date), "yyyy-MM-dd"),
      eventType: event.eventType,
      subjectId: event.subjectId ? event.subjectId.toString() : "none",
    });
    setEditingId(event.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this event?")) {
      deleteEvent.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
          queryClient.invalidateQueries({ queryKey: ["/api/calendar/upcoming"] });
          queryClient.invalidateQueries({ queryKey: ["/api/calendar/next-exam"] });
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      title: formData.title,
      description: formData.description,
      date: new Date(formData.date).toISOString(),
      eventType: formData.eventType,
      subjectId: formData.subjectId !== "none" ? parseInt(formData.subjectId) : undefined,
    };

    if (editingId) {
      updateEvent.mutate(
        { id: editingId, data: submitData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
            queryClient.invalidateQueries({ queryKey: ["/api/calendar/upcoming"] });
            queryClient.invalidateQueries({ queryKey: ["/api/calendar/next-exam"] });
            setIsDialogOpen(false);
            resetForm();
          }
        }
      );
    } else {
      createEvent.mutate(
        { data: submitData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
            queryClient.invalidateQueries({ queryKey: ["/api/calendar/upcoming"] });
            queryClient.invalidateQueries({ queryKey: ["/api/calendar/next-exam"] });
            setIsDialogOpen(false);
            resetForm();
          }
        }
      );
    }
  };

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = monthStart;
  const daysInMonth = eachDayOfInterval({ start: startDate, end: monthEnd });
  
  // Pad beginning of month
  const startDayOfWeek = startDate.getDay();
  const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => null);
  
  const allDays = [...paddingDays, ...daysInMonth];

  const getEventsForDay = (date: Date) => {
    if (!events) return [];
    return events.filter(e => isSameDay(new Date(e.date), date));
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'exam': return "bg-red-500 text-white";
      case 'deadline': return "bg-orange-500 text-white";
      case 'reminder': return "bg-amber-500 text-white";
      default: return "bg-blue-500 text-white";
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="Calendar" 
        description="Schedule exams, assignments, and reminders." 
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Event" : "New Event"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select value={formData.eventType} onValueChange={(val: any) => setFormData({...formData, eventType: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">General Event</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Related Subject</Label>
                  <Select value={formData.subjectId} onValueChange={(val) => setFormData({...formData, subjectId: val})}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {subjects?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Event</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <h2 className="text-xl font-bold text-foreground">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-border gap-[1px]">
            {allDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="bg-muted/10 min-h-[100px]" />;
              
              const dayEvents = getEventsForDay(date);
              const isSelected = selectedDay && isSameDay(date, selectedDay);
              
              return (
                <div 
                  key={date.toISOString()} 
                  className={`bg-card min-h-[100px] p-1.5 flex flex-col cursor-pointer transition-colors
                    ${!isSameMonth(date, currentDate) ? 'opacity-50 bg-muted/20' : ''}
                    ${isToday(date) ? 'bg-primary/5' : 'hover:bg-muted/30'}
                    ${isSelected ? 'ring-2 ring-inset ring-primary' : ''}
                  `}
                  onClick={() => setSelectedDay(date)}
                >
                  <div className={`text-right text-xs font-semibold p-1 mb-1
                    ${isToday(date) ? 'text-primary' : 'text-foreground/70'}
                  `}>
                    <span className={isToday(date) ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 inline-flex items-center justify-center' : ''}>
                      {format(date, "d")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 overflow-y-auto hide-scrollbar flex-1">
                    {dayEvents.slice(0, 3).map(e => (
                      <div key={e.id} className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${getEventBadgeColor(e.eventType)}`} title={e.title}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground text-center font-medium">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <Card className="flex-1 min-h-[400px]">
            <CardHeader className="pb-3 border-b border-border bg-muted/30">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                {selectedDay ? format(selectedDay, "MMMM d, yyyy") : "Upcoming Events"}
                {selectedDay && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setSelectedDay(null)}>View All</Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto h-[400px]">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : (() => {
                const displayEvents = selectedDay 
                  ? getEventsForDay(selectedDay) 
                  : (events?.filter(e => new Date(e.date) >= new Date()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 10) || []);

                if (displayEvents.length === 0) {
                  return (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                      <CalendarIcon className="w-8 h-8 opacity-20 mb-2" />
                      <p className="text-sm">No events to display.</p>
                      {selectedDay && (
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => { resetForm(selectedDay); setIsDialogOpen(true); }}>
                          <Plus className="w-3 h-3 mr-1" /> Add Event
                        </Button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-border">
                    {displayEvents.map(e => (
                      <div key={e.id} className="p-4 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-start justify-between mb-1">
                          <Badge className={`text-[10px] px-1.5 py-0 border-0 ${getEventBadgeColor(e.eventType)} uppercase`}>{e.eventType}</Badge>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <button className="text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(e)}><Edit2 className="w-3 h-3" /></button>
                            <button className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <h4 className="font-bold text-sm text-foreground">{e.title}</h4>
                        {!selectedDay && <div className="text-xs font-semibold text-primary mt-1">{format(new Date(e.date), "MMM d, yyyy")}</div>}
                        {e.subjectName && <div className="text-xs text-muted-foreground mt-1">{e.subjectName}</div>}
                        {e.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{e.description}</p>}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}