import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, Task } from '@/hooks/useTasks';
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const EmployeeTasks = () => {
  const { user } = useAuth();
  const { tasks, loading, updateTaskStatus } = useTasks();

  // Filter tasks assigned to current user
  const myTasks = tasks.filter(task => task.assigned_to === user?.id);
  
  const pendingTasks = myTasks.filter(t => t.status === 'pending');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress');
  const completedTasks = myTasks.filter(t => t.status === 'completed');

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    await updateTaskStatus(taskId, newStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
    
    return (
      <Card className={cn(
        "border-border/50 transition-all duration-300 hover:shadow-lg",
        isOverdue && "border-red-300 dark:border-red-800"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge className={getStatusColor(task.status)}>
                  {task.status === 'completed' ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                </Badge>
                {task.due_date && (
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    isOverdue 
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {task.status !== 'completed' && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
              {task.status === 'pending' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleStatusChange(task.id, 'in_progress')}
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Start
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={() => handleStatusChange(task.id, 'completed')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 text-white animate-fade-in">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
          
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <ClipboardList className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">My Tasks</h1>
                <p className="text-white/70 text-sm mt-1">View and manage your assigned tasks</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-center">
                <p className="text-2xl font-bold text-amber-400">{pendingTasks.length}</p>
                <p className="text-xs text-white/70">Pending</p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-center">
                <p className="text-2xl font-bold text-blue-400">{inProgressTasks.length}</p>
                <p className="text-xs text-white/70">In Progress</p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-center">
                <p className="text-2xl font-bold text-green-400">{completedTasks.length}</p>
                <p className="text-xs text-white/70">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading tasks...</p>
          </div>
        ) : myTasks.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-semibold text-muted-foreground">No Tasks Assigned</h3>
              <p className="text-sm text-muted-foreground mt-1">You don't have any tasks assigned yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pending & In Progress Tasks */}
            {(pendingTasks.length > 0 || inProgressTasks.length > 0) && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Active Tasks
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...inProgressTasks, ...pendingTasks].map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Completed Tasks
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeTasks;
