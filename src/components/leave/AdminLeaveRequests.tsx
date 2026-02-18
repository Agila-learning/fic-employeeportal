import { format } from 'date-fns';
import { CalendarIcon, Clock, CheckCircle, XCircle, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { icon: CheckCircle, label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const AdminLeaveRequests = () => {
  const { leaveRequests, isLoading, updateLeaveStatus } = useLeaveRequests();

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
  const processedRequests = leaveRequests.filter(r => r.status !== 'pending');

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">Loading leave requests...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card className="border-border/50 overflow-hidden animate-fade-in">
        <CardHeader className="border-b border-border/50 bg-muted/30 pb-3">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending Leave Requests
            {pendingRequests.length > 0 && (
              <Badge className="ml-auto bg-amber-500 text-white">{pendingRequests.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendingRequests.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No pending leave requests
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0">
                      <UserCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{req.employee_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(req.leave_date), 'PPP')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{req.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested on {format(new Date(req.created_at), 'PPP')}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 gap-1"
                        onClick={() => updateLeaveStatus(req.id, 'approved')}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Approve</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1"
                        onClick={() => updateLeaveStatus(req.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Reject</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card className="border-border/50 overflow-hidden animate-fade-in">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-3">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              Processed Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {processedRequests.map((req) => {
                const config = statusConfig[req.status];
                const StatusIcon = config.icon;
                return (
                  <div key={req.id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                    <div className={cn('p-2 rounded-lg', config.className)}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{req.employee_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(req.leave_date), 'PPP')} — {req.reason}
                      </p>
                    </div>
                    <Badge className={cn('text-xs shrink-0', config.className)}>
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminLeaveRequests;
