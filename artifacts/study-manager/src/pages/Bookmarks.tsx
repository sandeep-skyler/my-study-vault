import { useListBookmarks, useDeleteBookmark } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, FunctionSquare, Video, File as FileIcon, BookmarkMinus, Bookmark as BookmarkIcon, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function Bookmarks() {
  const { data: bookmarks, isLoading } = useListBookmarks();
  const deleteBookmark = useDeleteBookmark();

  const handleRemove = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteBookmark.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'note': return <FileText className="w-5 h-5" />;
      case 'formula': return <FunctionSquare className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'file': return <FileIcon className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'note': return "text-violet-500 bg-violet-500/10";
      case 'formula': return "text-amber-500 bg-amber-500/10";
      case 'video': return "text-fuchsia-500 bg-fuchsia-500/10";
      case 'file': return "text-blue-500 bg-blue-500/10";
      default: return "text-primary bg-primary/10";
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Bookmarks" 
        description="Your saved notes, formulas, files, and videos." 
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : bookmarks && bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookmarks.map((bookmark) => {
            // Determine the URL based on type
            // In a real app we might pass the subjectId in the bookmark or search API
            // For now, if we don't have subjectId, we have to route to search or somehow find it
            // Assuming we route to a topic tab if we know topic details.
            // Wait, we only have itemId, itemType, title, subjectName, topicName.
            // We need topicId to link properly. Let's assume we can search for it or just show the info.
            // Actually, we can add a generic view or just use the title to search if we lack topicId.
            // For now, let's just make it a card that shows the info. 
            // In the API schema, Bookmark doesn't have topicId, only names. 
            
            return (
              <Card key={bookmark.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={`p-4 flex items-center justify-center border-r border-border ${getColorClass(bookmark.itemType)}`}>
                      {getIcon(bookmark.itemType)}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-foreground text-sm truncate">{bookmark.title}</h4>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2"
                          onClick={(e) => handleRemove(bookmark.id, e)}
                          title="Remove bookmark"
                        >
                          <BookmarkMinus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold border-border px-1.5 py-0 bg-background">
                          {bookmark.itemType}
                        </Badge>
                        <span className="truncate">
                          {bookmark.subjectName} {bookmark.topicName && `› ${bookmark.topicName}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <BookmarkIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No bookmarks yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Save important notes, formulas, and files across your subjects to quickly access them here.
          </p>
        </div>
      )}
    </div>
  );
}