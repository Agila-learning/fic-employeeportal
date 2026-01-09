import { useAnnouncements } from '@/hooks/useAnnouncements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const AnnouncementsCard = () => {
  const { announcements, loading } = useAnnouncements();
  const activeAnnouncements = announcements.filter(a => a.is_active);

  if (loading) {
    return (
      <Card className="border-border/50 animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
        <CardTitle className="text-sm sm:text-lg font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <span className="truncate">Announcements</span>
          {activeAnnouncements.length > 0 && (
            <span className="ml-auto sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] sm:text-xs font-bold shrink-0">
              {activeAnnouncements.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {activeAnnouncements.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">No announcements</p>
        ) : (
          <ScrollArea className="h-[160px] sm:h-[200px] pr-2 sm:pr-4">
            <div className="space-y-2 sm:space-y-3">
              {activeAnnouncements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 shadow-sm"
                >
                  <h4 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1">{announcement.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 sm:whitespace-pre-wrap">{announcement.message}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] sm:text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnouncementsCard;
