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
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'in_progress': return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          My Tasks
          {pendingTasks.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {pendingTasks.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {myTasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No tasks assigned</p>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {myTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-300",
                    task.status === 'completed' 
                      ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                      : "bg-muted/30 border-border/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <h4 className={cn(
                          "font-semibold truncate",
                          task.status === 'completed' && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h4>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, getNextStatus(task.status))}
                        className="shrink-0"
                      >
                        {task.status === 'pending' ? 'Start' : 'Complete'}
                      </Button>
                    )}
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
