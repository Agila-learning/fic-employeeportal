import { useEffect, useState } from 'react';
import { Task } from '@/hooks/useTasks';
import { isToday, isTomorrow, isPast, parseISO, isBefore, addDays } from 'date-fns';
import { playNotificationSound } from '@/utils/notificationSound';

export interface TaskReminder {
  task: Task;
  type: 'overdue' | 'today' | 'tomorrow' | 'upcoming';
  message: string;
}

export const useTaskReminders = (tasks: Task[], userId?: string) => {
  const [reminders, setReminders] = useState<TaskReminder[]>([]);
  const [hasUrgentReminders, setHasUrgentReminders] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const myTasks = tasks.filter(t => t.assigned_to === userId && t.status !== 'completed');
    const taskReminders: TaskReminder[] = [];

    myTasks.forEach(task => {
      if (!task.due_date) return;
      
      const dueDate = parseISO(task.due_date);
      const today = new Date();
      
      if (isPast(dueDate) && !isToday(dueDate)) {
        taskReminders.push({
          task,
          type: 'overdue',
          message: 'Task is overdue!',
        });
      } else if (isToday(dueDate)) {
        taskReminders.push({
          task,
          type: 'today',
          message: 'Due today',
        });
      } else if (isTomorrow(dueDate)) {
        taskReminders.push({
          task,
          type: 'tomorrow',
          message: 'Due tomorrow',
        });
      } else if (isBefore(dueDate, addDays(today, 7))) {
        taskReminders.push({
          task,
          type: 'upcoming',
          message: 'Due this week',
        });
      }
    });

    // Sort by urgency
    taskReminders.sort((a, b) => {
      const order = { overdue: 0, today: 1, tomorrow: 2, upcoming: 3 };
      return order[a.type] - order[b.type];
    });

    setReminders(taskReminders);
    
    const urgent = taskReminders.some(r => r.type === 'overdue' || r.type === 'today');
    
    // Play sound only if there are new urgent reminders
    if (urgent && !hasUrgentReminders) {
      playNotificationSound('warning');
    }
    
    setHasUrgentReminders(urgent);
  }, [tasks, userId]);

  return { reminders, hasUrgentReminders };
};
