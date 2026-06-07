import { 
  useGetDashboardStats, 
  useGetNextExam, 
  useListUpcomingEvents, 
  useGetImportantFormulas, 
  useGetDashboardTodos, 
  useGetRecentQuickNotes,
  useCompleteTodo,
  getGetDashboardTodosQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, FileText, Video, CheckSquare, Layers, FunctionSquare, Calendar as CalendarIcon, Clock, Star, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

const statCards = [
  { label: "Subjects", key: "subjectCount" as const, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10", href: "/subjects" },
  { label: "Topics", key: "topicCount" as const, icon: Layers, color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/subjects" },
  { label: "Notes", key: "noteCount" as const, icon: FileText, color: "text-violet-500", bg: "bg-violet-500/10", href: "/subjects" },
  { label: "Videos", key: "videoCount" as const, icon: Video, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", href: "/subjects" },
  { label: "Pending Todos", key: "pendingTodoCount" as const, icon: CheckSquare, color: "text-rose-500", bg: "bg-rose-500/10", href: "/todos" },
  { label: "Key Formulas", key: "keyFormulaCount" as const, icon: FunctionSquare, color: "text-amber-500", bg: "bg-amber-500/10", href: "/subjects" },
];

export default function Dashboard() {
  const { data: stats } = useGetDashboardStats();
  const { data: nextExam } = useGetNextExam();
  const { data: upcomingEvents } = useListUpcomingEvents();
  const { data: importantFormulas } = useGetImportantFormulas();
  const { data: dashboardTodos } = useGetDashboardTodos();
  const { data: recentNotes } = useGetRecentQuickNotes();
  const completeTodo = useCompleteTodo();
  const queryClient = useQueryClient();

  const handleToggleTodo = (id: number) => {
    completeTodo.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardTodosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader title="Dashboard" description="Welcome back. Here's what's happening." />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="border-border shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats?.[stat.key] ?? 0}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Exam Banner */}
          {nextExam?.event && (
            <Link href="/calendar">
              <Card className={`border-2 cursor-pointer hover:shadow-md transition-shadow ${
                (nextExam.daysRemaining ?? 99) <= 3 ? "border-red-500/50 bg-red-500/5" :
                (nextExam.daysRemaining ?? 99) <= 7 ? "border-amber-500/50 bg-amber-500/5" :
                "border-blue-500/50 bg-blue-500/5"
              }`}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      Next Exam: {nextExam.event.title}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {nextExam.event.subjectName && `${nextExam.event.subjectName} • `}
                      {format(new Date(nextExam.event.date), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-black ${
                      (nextExam.daysRemaining ?? 99) <= 3 ? "text-red-600 dark:text-red-400" :
                      (nextExam.daysRemaining ?? 99) <= 7 ? "text-amber-600 dark:text-amber-400" :
                      "text-blue-600 dark:text-blue-400"
                    }`}>
                      {nextExam.daysRemaining}
                    </div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Days Left</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Pending Todos */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                Pending Todos
              </CardTitle>
              <Link href="/todos" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {dashboardTodos && dashboardTodos.length > 0 ? (
                <div className="space-y-1">
                  {dashboardTodos.map((todo) => (
                    <div key={todo.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors" data-testid={`todo-item-${todo.id}`}>
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggleTodo(todo.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{todo.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {todo.subjectName && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{todo.subjectName}</Badge>
                          )}
                          {todo.dueDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(todo.dueDate), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center">
                  <CheckSquare className="w-8 h-8 mb-2 opacity-20" />
                  No pending todos. You're all caught up!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Formulas */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                Key Formulas
              </CardTitle>
              <Link href="/subjects" className="text-sm font-medium text-primary hover:underline">Browse subjects</Link>
            </CardHeader>
            <CardContent>
              {importantFormulas && importantFormulas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {importantFormulas.map((formula) => (
                    <div key={formula.id} className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10 relative overflow-hidden group" data-testid={`card-formula-${formula.id}`}>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-bl-full pointer-events-none" />
                      <h4 className="font-bold text-foreground mb-1">{formula.title}</h4>
                      <p className="text-xs text-muted-foreground mb-3">{formula.subjectName} • {formula.topicName}</p>
                      {formula.content && (
                        <div className="bg-background/80 dark:bg-background/50 p-2 rounded border border-border font-mono text-sm text-foreground overflow-x-auto whitespace-pre-wrap">
                          {formula.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Star important formulas to see them here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex gap-4" data-testid={`event-item-${event.id}`}>
                      <div className="flex flex-col items-center min-w-10">
                        <span className="text-xs font-bold text-muted-foreground uppercase">{format(new Date(event.date), "MMM")}</span>
                        <span className="text-lg font-black text-foreground leading-none">{format(new Date(event.date), "d")}</span>
                      </div>
                      <div className="flex-1 pb-4 border-b border-border last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-foreground">{event.title}</h4>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${
                            event.eventType === "exam" ? "bg-red-500/10 text-red-600" :
                            event.eventType === "deadline" ? "bg-orange-500/10 text-orange-600" :
                            event.eventType === "reminder" ? "bg-amber-500/10 text-amber-600" :
                            "bg-blue-500/10 text-blue-600"
                          }`}>
                            {event.eventType}
                          </Badge>
                        </div>
                        {event.subjectName && <p className="text-xs text-muted-foreground mt-1">{event.subjectName}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No upcoming events.
                </div>
              )}
              <Link href="/calendar" className="block text-center text-sm font-medium text-primary hover:underline mt-4 pt-4 border-t border-border">
                Open Calendar
              </Link>
            </CardContent>
          </Card>

          {/* Quick Notes */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-primary" />
                Recent Notes
              </CardTitle>
              <Link href="/quick-notes" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {recentNotes && recentNotes.length > 0 ? (
                <div className="space-y-3">
                  {recentNotes.map((note) => (
                    <Link key={note.id} href="/quick-notes">
                      <div
                        className="p-3 rounded-r-lg rounded-l-sm bg-card border border-border border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        style={{ borderLeftColor: note.color }}
                        data-testid={`quick-note-${note.id}`}
                      >
                        <h4 className="font-bold text-sm text-foreground mb-1">{note.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">No quick notes yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
