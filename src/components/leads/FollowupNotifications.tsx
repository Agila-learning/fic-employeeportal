import { useEffect, useState, useRef } from 'react';
import { Lead, STATUS_OPTIONS } from '@/types';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { Bell, Calendar, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { playNotificationSound } from '@/utils/notificationSound';

interface FollowupNotificationsProps {
  leads: Lead[];
  onViewLead?: (lead: Lead) => void;
}

interface NotificationItem {
  lead: Lead;
  type: 'today' | 'overdue' | 'upcoming';
  message: string;
}

const FollowupNotifications = ({ leads, onViewLead }: FollowupNotificationsProps) => {
  const [open, setOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const prevUrgentCount = useRef(0);

  useEffect(() => {
    const followupLeads = leads.filter(l => l.followup_date && l.status === 'follow_up');
    const notificationItems: NotificationItem[] = [];

    followupLeads.forEach(lead => {
      if (!lead.followup_date) return;
      
      const followupDate = parseISO(lead.followup_date);
      
      if (isToday(followupDate)) {
        notificationItems.push({
          lead,
          type: 'today',
          message: `Follow-up scheduled for today`,
        });
      } else if (isPast(followupDate)) {
        notificationItems.push({
          lead,
          type: 'overdue',
          message: `Follow-up was due on ${format(followupDate, 'MMM d, yyyy')}`,
        });
      } else if (isTomorrow(followupDate)) {
        notificationItems.push({
          lead,
          type: 'upcoming',
          message: `Follow-up scheduled for tomorrow`,
        });
      }
    });

    // Sort: overdue first, then today, then upcoming
    notificationItems.sort((a, b) => {
      const order = { overdue: 0, today: 1, upcoming: 2 };
      return order[a.type] - order[b.type];
    });

    setNotifications(notificationItems);
    
    const urgentCount = notificationItems.filter(n => n.type === 'today' || n.type === 'overdue').length;
    const hasUrgent = urgentCount > 0;
    
    // Play sound only if there are new urgent notifications
    if (urgentCount > prevUrgentCount.current) {
      playNotificationSound('warning');
    }
    prevUrgentCount.current = urgentCount;
    
    setHasNewNotifications(hasUrgent);
  }, [leads]);

  const getTypeStyles = (type: NotificationItem['type']) => {
    switch (type) {
      case 'overdue':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
      case 'today':
        return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
      case 'upcoming':
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
    }
  };

  const getTypeBadge = (type: NotificationItem['type']) => {
    switch (type) {
      case 'overdue':
        return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
      case 'today':
        return <Badge className="bg-amber-500 text-xs">Today</Badge>;
      case 'upcoming':
        return <Badge variant="secondary" className="text-xs">Tomorrow</Badge>;
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {hasNewNotifications && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {notifications.filter(n => n.type === 'today' || n.type === 'overdue').length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Follow-up Reminders
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No follow-up reminders</p>
                <p className="text-sm">Schedule follow-ups on your leads to see them here</p>
              </div>
            ) : (
              <div className="space-y-3 p-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.lead.id}
                    className={cn(
                      'p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md',
                      getTypeStyles(notification.type)
                    )}
                    onClick={() => {
                      onViewLead?.(notification.lead);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeBadge(notification.type)}
                          <span className="text-xs text-muted-foreground font-mono">
                            {notification.lead.candidate_id}
                          </span>
                        </div>
                        <p className="font-medium truncate">{notification.lead.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{notification.lead.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FollowupNotifications;