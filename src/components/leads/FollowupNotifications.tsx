import { useEffect, useState, useRef } from 'react';
import { Lead, STATUS_OPTIONS } from '@/types';
import { format, isToday, isTomorrow, isPast, parseISO, isWithinInterval, addHours } from 'date-fns';
import { Bell, Calendar, User, X, AlertTriangle } from 'lucide-react';
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
  type: 'today' | 'overdue' | 'upcoming' | 'urgent' | 'max_attempts';
  message: string;
}

const MAX_FOLLOWUP_COUNT = 6;

const FollowupNotifications = ({ leads, onViewLead }: FollowupNotificationsProps) => {
  const [open, setOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const prevUrgentCount = useRef(0);

  useEffect(() => {
    // Exclude leads that are already success or have full payment done
    const followupLeads = leads.filter(l => {
      if (!l.followup_date) return false;
      if (l.status !== 'follow_up') return false;
      if (l.payment_stage === 'full_payment_done') return false;
      return true;
    });
    const notificationItems: NotificationItem[] = [];
    const now = new Date();

    followupLeads.forEach(lead => {
      if (!lead.followup_date) return;
      
      const followupDate = parseISO(lead.followup_date);
      
      // Check for max attempts reached
      if ((lead.followup_count || 0) >= MAX_FOLLOWUP_COUNT) {
        notificationItems.push({
          lead,
          type: 'max_attempts',
          message: `Maximum follow-up attempts reached. Action required!`,
        });
        return;
      }
      
      // Check if followup is within the next 2 hours (urgent)
      const twoHoursFromNow = addHours(now, 2);
      if (isWithinInterval(followupDate, { start: now, end: twoHoursFromNow })) {
        notificationItems.push({
          lead,
          type: 'urgent',
          message: `Follow-up due in ${Math.ceil((followupDate.getTime() - now.getTime()) / (1000 * 60))} minutes`,
        });
      } else if (isToday(followupDate) && !isPast(followupDate)) {
        notificationItems.push({
          lead,
          type: 'today',
          message: `Follow-up scheduled for ${format(followupDate, 'h:mm a')}`,
        });
      } else if (isPast(followupDate)) {
        notificationItems.push({
          lead,
          type: 'overdue',
          message: `Follow-up was due on ${format(followupDate, 'MMM d, yyyy h:mm a')}`,
        });
      } else if (isTomorrow(followupDate)) {
        notificationItems.push({
          lead,
          type: 'upcoming',
          message: `Follow-up scheduled for tomorrow at ${format(followupDate, 'h:mm a')}`,
        });
      }
    });

    // Sort: max_attempts first, overdue, urgent, today, then upcoming
    notificationItems.sort((a, b) => {
      const order = { max_attempts: 0, overdue: 1, urgent: 2, today: 3, upcoming: 4 };
      return order[a.type] - order[b.type];
    });

    setNotifications(notificationItems);
    
    const urgentCount = notificationItems.filter(n => 
      n.type === 'today' || n.type === 'overdue' || n.type === 'urgent' || n.type === 'max_attempts'
    ).length;
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
      case 'max_attempts':
        return 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20';
      case 'overdue':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
      case 'urgent':
        return 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20';
      case 'today':
        return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
      case 'upcoming':
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
    }
  };

  const getTypeBadge = (type: NotificationItem['type']) => {
    switch (type) {
      case 'max_attempts':
        return <Badge className="bg-purple-500 text-xs">Max Attempts</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-500 text-xs">Due Soon</Badge>;
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
            {notifications.filter(n => n.type === 'today' || n.type === 'overdue' || n.type === 'urgent' || n.type === 'max_attempts').length}
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
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {getTypeBadge(notification.type)}
                          <span className="text-xs text-muted-foreground font-mono">
                            {notification.lead.candidate_id}
                          </span>
                          {notification.type === 'max_attempts' && (
                            <AlertTriangle className="h-3 w-3 text-purple-500" />
                          )}
                        </div>
                        <p className="font-medium truncate">{notification.lead.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{notification.lead.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: MAX_FOLLOWUP_COUNT }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${i < (notification.lead.followup_count || 0) ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                              />
                            ))}
                            <span className="text-[10px] text-muted-foreground ml-1">
                              {notification.lead.followup_count || 0}/{MAX_FOLLOWUP_COUNT}
                            </span>
                          </div>
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