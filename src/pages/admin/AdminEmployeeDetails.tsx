import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DRIVE_URL = 'https://drive.google.com/drive/folders/1-7PHoUruvtXV6JdKgXK8dE-xhfZaTz9l?usp=sharing';

const AdminEmployeeDetails = () => {
  const handleCopy = () => {
    navigator.clipboard.writeText(DRIVE_URL);
    toast.success('Link copied to clipboard!');
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Details</h1>
          <p className="text-muted-foreground">Access employee documents and files</p>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Employee Documents Drive</h2>
                <p className="text-sm text-muted-foreground">Copy the link below and paste it in your browser to access the drive.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-mono break-all flex-1 select-all text-foreground">{DRIVE_URL}</p>
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminEmployeeDetails;
