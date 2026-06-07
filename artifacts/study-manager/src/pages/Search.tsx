import { useState, useEffect } from "react";
import { useGlobalSearch } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, FileText, FunctionSquare, Video, File as FileIcon, ExternalLink } from "lucide-react";
import { Link } from "wouter";

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  
  const { data: searchData, isLoading } = useGlobalSearch(
    { q: debouncedQuery }, 
    { query: { enabled: debouncedQuery.length >= 2 } as any }
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'note': return <FileText className="w-5 h-5" />;
      case 'formula': return <FunctionSquare className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'file': return <FileIcon className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTab = (type: string) => {
    switch (type) {
      case 'note': return "notes";
      case 'formula': return "formulas";
      case 'video': return "videos";
      case 'file': return "files";
      default: return "notes";
    }
  };

  const results = searchData?.results || [];

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <PageHeader 
        title="Search" 
        description="Find notes, formulas, videos, and files across all subjects." 
      />

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          className="pl-12 h-14 text-lg bg-card border-border shadow-sm rounded-xl focus-visible:ring-primary"
          placeholder="Search materials (e.g. Newton, Calculus)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="mt-8">
        {debouncedQuery.length < 2 ? (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
            <SearchIcon className="w-12 h-12 opacity-20 mb-4" />
            <p>Type at least 2 characters to search.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Found {results.length} results
            </h3>
            {results.map((result, i) => (
              <Link 
                key={`${result.type}-${result.id}-${i}`} 
                href={result.topicId ? `/topics/${result.topicId}?tab=${getTab(result.type)}` : '#'}
              >
                <Card className="hover:bg-accent/30 transition-colors cursor-pointer border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-secondary text-secondary-foreground rounded-lg">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-base mb-1 truncate">{result.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-border bg-background">
                          {result.type}
                        </Badge>
                        <span className="truncate">
                          {result.subjectName} {result.topicName && `› ${result.topicName}`}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-50" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border flex flex-col items-center">
            <h3 className="text-lg font-bold text-foreground mb-1">No results found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}