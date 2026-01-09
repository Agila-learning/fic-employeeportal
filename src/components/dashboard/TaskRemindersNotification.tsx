import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskReminders, TaskReminder } from '@/hooks/useTaskReminders';
import { ListTodo, Clock, AlertTriangle, Calendar } from 'lucide-react';
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
import { format, parseISO } from 'date-fns';

const TaskRemindersNotification = () => {
  const [open, setOpen] = useState(false);
  const { tasks } = useTasks();
  const { user } = useAuth();
  const { reminders, hasUrgentReminders } = useTaskReminders(tasks, user?.id);

  const getTypeStyles = (type: TaskReminder['type']) => {
    switch (type) {
      case 'overdue':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
      case 'today':
        return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
      case 'tomorrow':
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
      case 'upcoming':
        return 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20';
    }
  };

  const getTypeBadge = (type: TaskReminder['type']) => {
    switch (type) {
      case 'overdue':
        return <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Overdue</Badge>;
      case 'today':
        return <Badge className="bg-amber-500 text-xs gap-1"><Clock className="h-3 w-3" />Today</Badge>;
      case 'tomorrow':
        return <Badge variant="secondary" className="text-xs gap-1"><Calendar className="h-3 w-3" />Tomorrow</Badge>;
      case 'upcoming':
        return <Badge className="bg-green-500 text-white text-xs gap-1"><Calendar className="h-3 w-3" />This Week</Badge>;
    }
  };

  if (reminders.length === 0) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <ListTodo className="h-5 w-5" />
        {hasUrgentReminders && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {reminders.filter(r => r.type === 'overdue' || r.type === 'today').length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-primary" />
              Task Reminders
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 p-1">
              {reminders.map((reminder) => (
                <div
                  key={reminder.task.id}
                  className={cn(
                    'p-4 rounded-lg border-l-4 transition-all hover:shadow-md',
                    getTypeStyles(reminder.type)
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeBadge(reminder.type)}
                      </div>
                      <p className="font-medium">{reminder.task.title}</p>
                      {reminder.task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {reminder.task.description}
                        </p>
                      )}
                      {reminder.task.due_date && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due: {format(parseISO(reminder.task.due_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskRemindersNotification;
