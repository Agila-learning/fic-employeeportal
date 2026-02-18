import { useState, useEffect, useRef } from 'react';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { playNotificationSound } from '@/utils/notificationSound';

const AnnouncementNotification = () => {
  const { announcements } = useAnnouncements();
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('readAnnouncementIds');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isOpen, setIsOpen] = useState(false);
  const prevUnreadCount = useRef(0);

  const activeAnnouncements = announcements.filter(a => a.is_active);
  const unreadCount = activeAnnouncements.filter(a => !readIds.has(a.id)).length;

  useEffect(() => {
    localStorage.setItem('readAnnouncementIds', JSON.stringify([...readIds]));
  }, [readIds]);

  // Play sound for new announcements
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current && prevUnreadCount.current !== 0) {
      playNotificationSound('info');
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const markAsRead = (id: string) => {
    setReadIds(prev => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    const allIds = new Set([...readIds, ...activeAnnouncements.map(a => a.id)]);
    setReadIds(allIds);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 hover:from-amber-400/30 hover:to-amber-600/30 transition-all"
        >
          <Megaphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-xs flex items-center justify-center font-bold shadow-lg animate-bounce-soft">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-amber-500" />
            Announcements
          </h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        
        {activeAnnouncements.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No announcements
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {activeAnnouncements.map((announcement) => {
                const isUnread = !readIds.has(announcement.id);
                return (
                  <div 
                    key={announcement.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      isUnread && "bg-amber-50/50 dark:bg-amber-950/20"
                    )}
                    onClick={() => markAsRead(announcement.id)}
                  >
                    <div className="flex items-start gap-3">
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                      )}
                      <div className={cn("flex-1 min-w-0", !isUnread && "ml-5")}>
                        <h5 className="font-medium text-sm break-words">{announcement.title}</h5>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3 break-words">
                          {announcement.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default AnnouncementNotification;