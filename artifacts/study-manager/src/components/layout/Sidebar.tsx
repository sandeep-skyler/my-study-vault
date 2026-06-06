import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { 
  LayoutDashboard, 
  Library, 
  Calendar as CalendarIcon, 
  StickyNote, 
  CheckSquare, 
  Bookmark, 
  LogOut,
  GraduationCap,
  Search as SearchIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/subjects", label: "Subjects", icon: Library },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
    { href: "/quick-notes", label: "Quick Notes", icon: StickyNote },
    { href: "/todos", label: "Todos", icon: CheckSquare },
    { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  ];

  return (
    <div className="w-64 border-r border-border bg-sidebar h-full flex flex-col">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 text-sidebar-foreground">
          <div className="p-2 bg-sidebar-primary rounded-lg text-sidebar-primary-foreground">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Study Manager</span>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <button 
          onClick={() => setLocation("/search")}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-background border border-border text-muted-foreground hover:bg-accent/50 transition-colors text-sm"
        >
          <SearchIcon className="w-4 h-4" />
          <span>Search...</span>
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || location.startsWith(`${link.href}/`);
          
          return (
            <Link key={link.href} href={link.href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm cursor-pointer
                ${isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-sidebar-primary" : "text-muted-foreground"}`} />
                {link.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.fullName || "User"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </div>
    </div>
  );
}