import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const TasksCard = () => {
  const { tasks, loading, updateTaskStatus } = useTasks();
  const { user } = useAuth();

  const myTasks = tasks.filter(t => t.assigned_to === user?.id);
  const pendingTasks = myTasks.filter(t => t.status !== 'completed');

  if (loading) {
    return (
      <Card className="border-border/50 animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3 text-amber-500 shrink-0" />;
      case 'in_progress': return <PlayCircle className="h-3 w-3 text-blue-500 shrink-0" />;
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />;
      default: return null;
    }
  };

  const getNextStatus = (currentStatus: string): 'pending' | 'in_progress' | 'completed' => {
    switch (currentStatus) {
      case 'pending': return 'in_progress';
      case 'in_progress': return 'completed';
      default: return 'pending';
    }
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">My Tasks</span>
          {pendingTasks.length > 0 && (
            <span className="ml-auto sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold shrink-0">
              {pendingTasks.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 px-3 sm:px-6">
        {myTasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-xs sm:text-sm">No tasks assigned</p>
        ) : (
          <ScrollArea className="h-[160px] sm:h-[180px] pr-2">
            <div className="space-y-2">
              {myTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={cn(
                    "p-2 sm:p-3 rounded-lg border transition-all duration-300",
                    task.status === 'completed' 
                      ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                      : "bg-muted/30 border-border/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="pt-0.5">{getStatusIcon(task.status)}</div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className={cn(
                        "font-medium text-xs sm:text-sm leading-tight line-clamp-1",
                        task.status === 'completed' && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-1 sm:gap-2 pt-1 flex-wrap">
                        {task.due_date && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                        {task.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskStatus(task.id, getNextStatus(task.status))}
                            className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs ml-auto"
                          >
                            {task.status === 'pending' ? 'Start' : 'Done'}
                          </Button>
                        )}
                      </div>
                    </div>
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

export default TasksCard;