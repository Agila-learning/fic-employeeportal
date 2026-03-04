import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationService } from '@/api/operationService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Clock, CalendarIcon, ListTodo, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const EmployeeTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await (operationService as any).getMyTasks();
      setTasks(data || []);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCompleteTask = async (taskId: string) => {
    try {
      await (operationService as any).updateTaskStatus(taskId, 'completed');
      toast.success('Task marked as completed');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground font-heading flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-primary" /> My Tasks
          </h1>
          <p className="text-muted-foreground">Manage and track your assigned tasks</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <ListTodo className="h-4 w-4" /> Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Task Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading tasks...</TableCell></TableRow>
                    ) : tasks.filter(t => t.status !== 'completed').length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No pending tasks found</TableCell></TableRow>
                    ) : tasks.filter(t => t.status !== 'completed').map((task) => (
                      <TableRow key={task._id || task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell><Badge variant="outline">{task.category}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <CalendarIcon className="h-3 w-3" />
                            {task.deadline ? format(parseISO(task.deadline), 'dd MMM yyyy') : 'No deadline'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-amber-500' :
                                'bg-emerald-500'
                          }>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleCompleteTask(task._id || task.id)} className="gap-2 hover:bg-emerald-100 hover:text-emerald-600 transition-colors">
                            <CheckCircle className="h-4 w-4" /> Mark Complete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Completed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Task Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Completed Date</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.filter(t => t.status === 'completed').length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No completed tasks yet</TableCell></TableRow>
                    ) : tasks.filter(t => t.status === 'completed').map((task) => (
                      <TableRow key={task._id || task.id} className="opacity-60">
                        <TableCell className="font-medium line-through">{task.title}</TableCell>
                        <TableCell><Badge variant="secondary">{task.category}</Badge></TableCell>
                        <TableCell className="text-xs">
                          {task.updated_at ? format(parseISO(task.updated_at), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Completed</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeTasks;
